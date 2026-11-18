// The public website chat: same bot brain and saved settings as Messenger, loaded on the server.
// The browser sends only its visitor id and the chat so far; it never sees the settings or the admin password.
import { list, put } from "@vercel/blob";
import { askLLM, extractLead, listLeads, loadSettings, saveLead, saveUnsure, takePhotos, takeUnsure } from "./bot.js";
import { publicHouses } from "./public.js";
import { notifyOwner } from "./push.js";
import { createRequest, customerMessage, handoverType, listRequests, loadVisitSettings, niceDate, openDays } from "./visits.js";

export const LIMITS = { userChars: 500, history: 12, perVisitor: 20, perIp: 40, windowMs: 10 * 60_000, daily: Number(process.env.PUBLIC_CHAT_DAILY_CAP) || 600 };
const CALL_US = "Pasensya na po, marami pong nagtatanong ngayon. Para mas mabilis, tumawag o mag-text po sa 0932 424 4949 (Smart) o 0976 229 0328 (Globe).";
const OFF = "Pasensya na po, naka-pahinga muna ang assistant. Tumawag o mag-text po sa 0932 424 4949 (Smart) o 0976 229 0328 (Globe).";

// ---------- spam and cost limits ----------
// ponytail: in memory, so each server instance counts on its own (best effort). Persistent limits need a database.
const hits = new Map();
let day = { key: "", count: 0 };
export function overLimit(visitorId, ip, now = Date.now()) {
  const today = new Date(now + 8 * 36e5).toISOString().slice(0, 10);
  if (day.key !== today) day = { key: today, count: 0 };
  if (day.count >= LIMITS.daily) return true;
  for (const [key, max] of [[`v:${visitorId}`, LIMITS.perVisitor], [`i:${ip}`, LIMITS.perIp]]) {
    const recent = (hits.get(key) || []).filter((t) => now - t < LIMITS.windowMs);
    if (recent.length >= max) return true;
    hits.set(key, recent);
  }
  for (const key of [`v:${visitorId}`, `i:${ip}`]) hits.get(key).push(now);
  day.count++;
  if (hits.size > 5000) hits.clear(); // keep memory small
  return false;
}
export function resetLimits() { hits.clear(); day = { key: "", count: 0 }; }

// ---------- saving chats ----------
// One small file per turn under chats/<visitor>/ (never overwritten, so nothing is lost to caching).
// ponytail: Vercel Blob for now; swap this one function for a database (spec §5) without touching the rest.
// Kinds of file: turn (customer + bot), owner (the owner's reply from the Bot Studio Inbox), mark (handled / closed / open).
const chatLocal = [];
const VISITOR = /^[a-z0-9-]{8,64}$/i;
async function saveChatFile(visitorId, kind, entry) {
  const data = { visitorId, kind, at: new Date().toISOString(), ...entry };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return void chatLocal.push(data);
  await put(`chats/${visitorId}/${kind}.json`, JSON.stringify(data), { access: "public", addRandomSuffix: true, contentType: "application/json" });
}
export const saveTurn = (visitorId, entry) => saveChatFile(visitorId, "turn", { source: "website", ...entry });
export const localTurns = () => chatLocal;

// every chat file under a prefix ("chats/" for all, "chats/<visitor>/" for one), oldest first
const kindOf = (path) => (path.split("/").pop().match(/^(turn|owner|mark)/) || [])[1];
async function chatFiles(prefix) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return chatLocal.filter((d) => `chats/${d.visitorId}/`.startsWith(prefix)).map((d) => ({ visitorId: d.visitorId, kind: d.kind || "turn", at: d.at, data: d }));
  }
  const out = [];
  let cursor;
  for (let page = 0; page < 10; page++) {
    const r = await list({ prefix, cursor, limit: 1000 });
    for (const b of r.blobs) {
      const kind = kindOf(b.pathname);
      if (kind) out.push({ visitorId: b.pathname.split("/")[1], kind, at: new Date(b.uploadedAt).toISOString(), url: b.url });
    }
    if (!r.hasMore) break;
    cursor = r.cursor;
  }
  return out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}
const readFile = async (f) => ({ ...(f.data || (await (await fetch(f.url, { cache: "no-store" })).json())), kind: f.kind, at: f.at });

// needs_owner: the bot handed over and the owner hasn't answered since. A newer customer message reopens a handled chat.
export function chatStatus({ lastCustomer = "", lastOwner = "", mark = null, handover = false }) {
  if (mark && mark.status !== "open" && mark.at >= lastCustomer) return mark.status;
  if (handover && lastOwner < lastCustomer) return "needs_owner";
  return lastOwner ? "owner_replied" : "bot";
}
const leadOf = (leads, visitorId) => leads.find((l) => l.userId === `web-${visitorId}`) || null;

// The Inbox list: newest chats first, one small read per chat (its newest message and newest mark).
export async function listChats(limit = 60) {
  const files = await chatFiles("chats/");
  const byVisitor = new Map();
  for (const f of files) byVisitor.set(f.visitorId, [...(byVisitor.get(f.visitorId) || []), f]);
  const leads = await listLeads(200).catch(() => []);
  const newest = [...byVisitor.entries()].sort((a, b) => (a[1].at(-1).at < b[1].at(-1).at ? 1 : -1)).slice(0, limit);
  return Promise.all(newest.map(async ([id, fs]) => {
    const turns = fs.filter((f) => f.kind === "turn");
    const owners = fs.filter((f) => f.kind === "owner");
    const marks = fs.filter((f) => f.kind === "mark");
    const lastMsg = fs.filter((f) => f.kind !== "mark").at(-1);
    const [last, mark] = await Promise.all([lastMsg && readFile(lastMsg).catch(() => null), marks.length ? readFile(marks.at(-1)).catch(() => null) : null]);
    const lead = leadOf(leads, id);
    return {
      id, name: lead?.name || "", mobile: lead?.mobile || "", house: lead?.house || "", at: fs.at(-1).at, messages: turns.length,
      last: !last ? "" : last.kind === "owner" ? `You: ${last.text}` : last.customer || "",
      status: chatStatus({ lastCustomer: turns.at(-1)?.at, lastOwner: owners.at(-1)?.at, mark, handover: !!lead || !!last?.handover }),
    };
  }));
}

// One whole chat for the Inbox, oldest first.
export async function readChat(visitorId) {
  if (!VISITOR.test(String(visitorId))) return null;
  const all = await Promise.all((await chatFiles(`chats/${visitorId}/`)).map((f) => readFile(f).catch(() => null)));
  const messages = [];
  let mark = null, page = "", handover = false;
  for (const d of all.filter(Boolean)) {
    if (d.kind === "turn") {
      page ||= d.page || "";
      handover ||= !!d.handover;
      messages.push({ from: "customer", text: d.customer || "", at: d.at });
      if (d.bot) messages.push({ from: "bot", text: d.bot, photos: d.photos || [], at: d.at });
    } else if (d.kind === "owner") messages.push({ from: "owner", text: d.text || "", at: d.at });
    else if (d.kind === "mark") mark = { status: d.status, at: d.at };
  }
  if (!messages.length) return null;
  const lead = leadOf(await listLeads(200).catch(() => []), visitorId);
  const lastOf = (who) => messages.filter((m) => m.from === who).at(-1)?.at;
  return {
    id: visitorId, messages, page,
    lead: lead && { name: lead.name || "", mobile: lead.mobile || "", house: lead.house || "", visitDate: lead.visitDate || "", summary: lead.summary || "" },
    status: chatStatus({ lastCustomer: lastOf("customer"), lastOwner: lastOf("owner"), mark, handover: handover || !!lead }),
  };
}

export async function ownerReply(visitorId, text) {
  text = String(text ?? "").trim().slice(0, 1000);
  if (!VISITOR.test(String(visitorId)) || !text) throw new Error("Nothing to send");
  await saveChatFile(visitorId, "owner", { text });
}
export async function markChat(visitorId, status) {
  if (!VISITOR.test(String(visitorId)) || !["handled", "closed", "open"].includes(status)) throw new Error("Bad mark");
  await saveChatFile(visitorId, "mark", { status });
}

// For the customer's own chat window: the owner's replies (and the newest mark) after a time. Nothing else is returned.
export async function ownerNews(visitorId, after = "") {
  if (!VISITOR.test(String(visitorId))) return null;
  const fs = (await chatFiles(`chats/${visitorId}/`)).filter((f) => f.kind !== "turn" && f.at > after);
  const owner = await Promise.all(fs.filter((f) => f.kind === "owner").map(async (f) => ({ text: (await readFile(f)).text || "", at: f.at })));
  return { owner, markAt: fs.filter((f) => f.kind === "mark").at(-1)?.at || "" };
}

// ---------- request checks ----------
export function cleanRequest(body) {
  const visitorId = String(body?.visitorId ?? "");
  if (!/^[a-z0-9-]{8,64}$/i.test(visitorId)) return null;
  if (body?.website) return null; // hidden field: only bots fill it in
  const msgs = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-LIMITS.history)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, m.role === "user" ? LIMITS.userChars : 1500) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs.at(-1).role !== "user") return null;
  return { visitorId, messages: msgs, page: String(body?.page ?? "").slice(0, 200) };
}

// Houses the reply names, for the small cards under it (exact listed names, longest first, at most 6).
const norm = (v) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function housesIn(reply, houses) {
  const text = ` ${norm(reply)} `;
  const found = [];
  for (const h of [...houses].sort((a, b) => norm(b.name).length - norm(a.name).length)) {
    const n = norm(h.name);
    if (n.length < 3 || !text.includes(` ${n} `)) continue;
    const same = houses.filter((x) => norm(x.name) === n);
    // the same name in several projects: show only the ones whose project or town is in the reply too
    const pick = same.length > 1 ? same.filter((x) => (norm(x.project) && text.includes(norm(x.project))) || (norm(x.town) && text.includes(` ${norm(x.town)} `))) : [h];
    for (const x of pick) if (!found.includes(x)) found.push(x);
  }
  return found.slice(0, 6).map((h) => ({ slug: h.slug, name: h.name, project: h.project, town: h.town, price: (h.options || []).map((o) => o.price).find(Boolean) || "", photo: h.photos[0] || "" }));
}

// ---------- site visit booking form (website) ----------
export async function visitDays() {
  const [settings, requests] = await Promise.all([loadVisitSettings(), listRequests()]);
  return { days: openDays(settings, requests) };
}
export async function bookVisit(body, ip = "", { houses = null } = {}) { // houses: the local preview passes its own list
  const visitorId = String(body?.visitorId ?? "");
  if (!VISITOR.test(visitorId) || body?.website) return { status: 400, json: { error: "bad request" } };
  if (overLimit(visitorId, ip)) return { status: 429, json: { error: "Too many tries. Please call or text 0932 424 4949." } };
  houses ||= publicHouses(await loadSettings());
  const h = houses.find((x) => x.slug === body?.house) || null;
  const [vs, requests] = await Promise.all([loadVisitSettings(), listRequests()]);
  let r;
  try {
    r = await createRequest({ type: "visit", source: "form", visitorId, name: body?.name, mobile: body?.mobile, date: body?.date, slot: body?.slot,
      house: h?.name, project: h?.project, town: h?.town, photo: h?.photos[0], lastMessages: Array.isArray(body?.messages) ? body.messages : [] }, { settings: vs, requests });
  } catch (err) {
    return { status: 400, json: { error: err.message } };
  }
  const message = customerMessage(r, vs);
  // also in the chat history, so the Inbox shows it and the bot knows a request is waiting
  await saveTurn(visitorId, { page: String(body?.page ?? "").slice(0, 200), customer: `(Booking form) Site visit request: ${[r.house, niceDate(r.date), vs.slots[r.slot]].filter(Boolean).join(", ")}. ${r.name}, ${r.mobile}`, bot: message, handover: true })
    .catch((err) => console.warn("Couldn't save the chat:", err.message));
  return { status: 200, json: { ok: true, message } };
}

// ---------- mobile numbers ----------
// The model sometimes accepts a number that can't be right (22 digits) or ignores "the first one was right".
// A Philippine mobile is 09XXXXXXXXX or +639XXXXXXXXX. Our own numbers are fine to mention.
const digits = (s) => String(s ?? "").replace(/\D/g, "");
export const validMobile = (s) => /^(?:63|0)9\d{9}$/.test(digits(s));
const NUMBERISH = /\+?\d[\d\s-]{6,}\d/g;
const OURS = ["09324244949", "09762290328"];
// the customer's newest valid mobile number in the chat, if any
export function goodMobile(messages) {
  for (const m of [...messages].reverse()) {
    if (m.role !== "user") continue;
    const ok = (m.content.match(NUMBERISH) || []).filter((n) => validMobile(n) && !OURS.includes(digits(n))).at(-1);
    if (ok) return ok.trim();
  }
  return "";
}
// A reply that repeats a number that isn't a valid mobile: use the customer's valid one if they gave one, otherwise ask again.
export function checkNumbers(reply, messages) {
  const bad = (reply.match(NUMBERISH) || []).filter((n) => digits(n).length >= 10 && !validMobile(n));
  if (!bad.length) return { reply, ok: true };
  const good = goodMobile(messages);
  if (good) return { reply: bad.reduce((r, n) => r.replace(n, good), reply), ok: true, fixed: good };
  return { reply: "Pasensya na po, mukhang hindi tama ang digits ng number. Pwede po bang pakiulit ang inyong 11-digit mobile number (hal. 0917 123 4567)?", ok: false };
}

// The whole website turn: limits, bot reply, photos, house cards, saving, and a lead when the bot hands over.
export async function websiteReply(body, ip = "") {
  const req = cleanRequest(body);
  if (!req) return { status: 400, json: { error: "bad request" } };
  if (overLimit(req.visitorId, ip)) return { status: 200, json: { reply: CALL_US, photos: [], houses: [], limited: true } };
  const settings = await loadSettings();
  if (settings.botSwitch === "off") return { status: 200, json: { reply: OFF, photos: [], houses: [] } };

  const asked = req.messages.at(-1).content;
  // The owner replied in the Inbox lately (and hasn't marked the chat handled): the bot stays quiet, the message is still saved.
  // The page passes the times of the owner messages it has shown; a customer can only quiet their own chat.
  const ownerAt = Date.parse(body?.ownerAt) || 0;
  if (ownerAt > (Date.parse(body?.markAt) || 0) && Date.now() - ownerAt < (Number(settings.quietMinutes) || 720) * 60_000) {
    await saveTurn(req.visitorId, { page: req.page, customer: asked, bot: "", quiet: true }).catch((err) => console.warn("Couldn't save the chat:", err.message));
    // urgent: the bot is quiet, so only the owner can answer this customer
    await notifyOwner({ title: "A customer wrote back", body: asked, url: `/?chat=${req.visitorId}#inbox`, tag: `chat-${req.visitorId}` });
    return { status: 200, json: { reply: "", quiet: true, photos: [], houses: [] } };
  }
  let reply = await askLLM(settings, req.messages, { channel: "website" });
  const unsure = takeUnsure(reply);
  reply = unsure.reply;
  if (unsure.unsure) await saveUnsure(asked).catch((err) => console.warn("Couldn't write down the question:", err.message));
  let handover = /\[AGENT\]/i.test(reply);
  reply = reply.replace(/\s*\[AGENT\]\s*/gi, " ").trim();
  // [VISIT: house] = show the booking form under the reply (the form, not the bot, collects date, name and number)
  const visitTok = reply.match(/\[VISIT(?::\s*([^\]]*))?\]/i);
  reply = reply.replace(/\s*\[VISIT[^\]]*\]\s*/gi, " ").trim();
  let visit = null;
  if (visitTok) {
    const pub = publicHouses(settings);
    const h = pub.find((x) => norm(x.name) === norm(visitTok[1]) || norm(`${x.name} ${x.project}`) === norm(visitTok[1]));
    visit = { house: h?.slug || "" };
    handover = false;
  }
  const nums = checkNumbers(reply, req.messages);
  reply = nums.reply;
  if (!nums.ok) handover = false; // no valid number yet: ask again before passing it on
  const taken = takePhotos(reply, settings.houses, { asked, context: req.messages.slice(-5, -1).map((m) => m.content).join("\n") });
  reply = taken.reply;
  const houses = taken.photos.length ? [] : housesIn(reply, publicHouses(settings));

  const chat = [...req.messages, { role: "assistant", content: reply }];
  await saveTurn(req.visitorId, { page: req.page, customer: asked, bot: reply, photos: taken.photos, handover }).catch((err) => console.warn("Couldn't save the chat:", err.message));
  if (handover) {
    try {
      const lead = await extractLead(chat);
      // the owner calls this number: keep it only if it is a real mobile, else the customer's last valid one
      if (!validMobile(lead.mobile)) lead.mobile = goodMobile(req.messages);
      await saveLead(`web-${req.visitorId}`, { ...lead, source: "website" });
      // and a card on the owner's Approvals page (a visit without a date goes there as "asked for a person")
      const type = handoverType(req.messages);
      await createRequest({ type: type === "visit" ? "person" : type, source: "chat", visitorId: req.visitorId, name: lead.name, mobile: lead.mobile, house: lead.house,
        note: type === "visit" ? `Wants a site visit; no date picked yet. ${lead.summary}` : lead.summary, lastMessages: chat });
    }
    catch (err) { console.warn("Couldn't write down the lead:", err.message); }
  }
  return { status: 200, json: { reply, photos: taken.photos, houses, handover, visit } };
}
