// Site visits and other requests that need the owner (spec: site-visit-calendar-and-approvals.md, adapted for the website).
// The bot never confirms anything: it creates a pending request; the owner approves, suggests another date, declines
// or marks it handled in Bot Studio. Customers are told by the owner's own text message and in their website chat.
import crypto from "node:crypto";
import { list, put } from "@vercel/blob";
import { notifyOwner } from "./push.js";
import { apex, apexConfig, useApex } from "./apex.js";

export const PHONES = "0932 424 4949 (Smart) o 0976 229 0328 (Globe)";
export const TYPES = { visit: "Site visit", reservation: "Reservation inquiry", person: "Asked for a person", price: "Price not listed", discount: "Discount or approval question" };
const STATUSES = ["pending", "suggested", "approved", "declined", "handled"];

// Placeholder hours until the client confirms (owner changes them on the Calendar page).
export const VISIT_DEFAULTS = { days: [1, 2, 3, 4, 5, 6], slots: { am: "Morning (9 AM to 12 NN)", pm: "Afternoon (1 PM to 4 PM)" }, maxPerSlot: 3, blocked: [], daysAhead: 45 };

const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const local = { settings: null, files: [] }; // self-check and local preview: kept in memory
const t = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-f0-9]{12}$/;
export const manilaToday = (now = Date.now()) => new Date(now + 8 * 36e5).toISOString().slice(0, 10);
const addDays = (date, n) => new Date(Date.parse(date + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const weekday = (date) => new Date(date + "T00:00:00Z").getUTCDay();
export const niceDate = (date) => (DATE.test(date) ? new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }) : "");

// ---------- visit settings (own file, separate from the bot's settings) ----------
export function cleanVisitSettings(s = {}) {
  const days = [...new Set((Array.isArray(s.days) ? s.days : VISIT_DEFAULTS.days).map(Number).filter((d) => d >= 0 && d <= 6))].sort();
  const slots = { am: t(s.slots?.am, 60) || VISIT_DEFAULTS.slots.am, pm: t(s.slots?.pm, 60) || VISIT_DEFAULTS.slots.pm };
  const maxPerSlot = Math.min(20, Math.max(1, Math.round(Number(s.maxPerSlot)) || VISIT_DEFAULTS.maxPerSlot));
  const blocked = [...new Set((Array.isArray(s.blocked) ? s.blocked : []).filter((d) => DATE.test(d)))].sort().slice(-200);
  return { days, slots, maxPerSlot, blocked, daysAhead: VISIT_DEFAULTS.daysAhead };
}
export async function loadVisitSettings() {
  if (useApex()) {
    try { return cleanVisitSettings((await apexConfig()).visit); } catch (err) { console.warn("Couldn't read the APEX visit settings:", err.message); return cleanVisitSettings(VISIT_DEFAULTS); }
  }
  if (!hasBlob()) return cleanVisitSettings(local.settings || VISIT_DEFAULTS);
  const { blobs } = await list({ prefix: "visits/settings" });
  const newest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  if (!newest) return cleanVisitSettings(VISIT_DEFAULTS);
  try { return cleanVisitSettings(await (await fetch(newest.url, { cache: "no-store" })).json()); } catch { return cleanVisitSettings(VISIT_DEFAULTS); }
}
export async function saveVisitSettings(s) {
  const clean = cleanVisitSettings(s);
  if (!hasBlob()) { local.settings = clean; return clean; }
  await put("visits/settings.json", JSON.stringify(clean), { access: "public", addRandomSuffix: true, contentType: "application/json" });
  return clean;
}

// ---------- requests: one "new" file plus one file per decision, never overwritten ----------
async function writeFile(id, kind, data) {
  const row = { ...data, id, kind, at: new Date().toISOString() };
  if (!hasBlob()) { local.files.push(row); return row; }
  // random suffix: the address can't be guessed (it holds a phone number)
  await put(`requests/${id}/${kind}.json`, JSON.stringify(row), { access: "public", addRandomSuffix: true, contentType: "application/json" });
  return row;
}
async function allFiles() {
  if (!hasBlob()) return [...local.files];
  const out = [];
  let cursor;
  for (let page = 0; page < 10; page++) {
    const r = await list({ prefix: "requests/", cursor, limit: 1000 });
    out.push(...r.blobs);
    if (!r.hasMore) break;
    cursor = r.cursor;
  }
  const rows = await Promise.all(out.map(async (b) => { try { return await (await fetch(b.url, { cache: "no-store" })).json(); } catch { return null; } }));
  return rows.filter(Boolean);
}
// the request as it stands after every decision, oldest decision first
function build(files) {
  const start = files.find((f) => f.kind === "new");
  if (!start) return null;
  const r = { ...start, status: "pending", history: [] };
  delete r.kind;
  r.createdAt = start.at;
  for (const e of files.filter((f) => f.kind === "ev").sort((a, b) => (a.at < b.at ? -1 : 1))) {
    r.history.push({ action: e.action, at: e.at, date: e.date || "", slot: e.slot || "", note: e.note || "" });
    r.decidedAt = e.at;
    if (e.action === "approve") { r.status = "approved"; if (r.suggestedDate) { r.date = r.suggestedDate; r.slot = r.suggestedSlot; } }
    if (e.action === "suggest") { r.status = "suggested"; r.suggestedDate = e.date; r.suggestedSlot = e.slot; }
    if (e.action === "decline") { r.status = "declined"; r.ownerNote = e.note || ""; }
    if (e.action === "handled") r.status = "handled";
    if (e.action === "reopen") r.status = "pending";
  }
  return r;
}
export async function listRequests() {
  if (useApex()) return apex("requests"); // visits that still hold a slot; the owner manages requests in APEX
  const byId = new Map();
  for (const f of await allFiles()) byId.set(f.id, [...(byId.get(f.id) || []), f]);
  return [...byId.values()].map(build).filter(Boolean).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
export async function getRequest(id) {
  if (!ID.test(String(id))) return null;
  return (await listRequests()).find((r) => r.id === id) || null;
}

// ---------- open days and slots ----------
// A slot is full when pending, suggested or approved visits there reach the maximum.
function taken(requests, date, slot, except = "") {
  return requests.filter((r) => r.type === "visit" && r.id !== except && ["pending", "suggested", "approved"].includes(r.status)
    && ((r.status === "suggested" ? r.suggestedDate : r.date) === date) && ((r.status === "suggested" ? r.suggestedSlot : r.slot) === slot)).length;
}
export function openDays(settings, requests, now = Date.now()) {
  const today = manilaToday(now);
  const out = [];
  for (let i = 1; i <= settings.daysAhead; i++) {
    const date = addDays(today, i);
    if (!settings.days.includes(weekday(date)) || settings.blocked.includes(date)) continue;
    out.push({ date, label: niceDate(date), slots: Object.entries(settings.slots).map(([id, label]) => ({ id, label, full: taken(requests, date, id) >= settings.maxPerSlot })) });
  }
  return out;
}
export function slotProblem(settings, requests, date, slot, now = Date.now(), except = "") {
  if (!DATE.test(String(date)) || !settings.slots[slot]) return "Please pick a date and a time.";
  const today = manilaToday(now);
  if (date <= today) return "Please pick a date from tomorrow onwards.";
  if (date > addDays(today, settings.daysAhead)) return "Please pick a date within the next 6 weeks.";
  if (!settings.days.includes(weekday(date)) || settings.blocked.includes(date)) return "Site visits aren't open on that day. Please pick another date.";
  if (taken(requests, date, slot, except) >= settings.maxPerSlot) return "That time is already full. Please pick another time or date.";
  return "";
}

// ---------- creating and deciding ----------
const digits = (s) => String(s ?? "").replace(/\D/g, "");
export const validMobile = (s) => /^(?:63|0)9\d{9}$/.test(digits(s));

// from the website form (type visit) or a bot handover (other types); the owner can also add a visit by hand
export async function createRequest(input, { now = Date.now(), settings, requests } = {}) {
  const type = TYPES[input.type] ? input.type : "person";
  const r = {
    type, name: t(input.name, 80), mobile: t(input.mobile, 30), visitorId: /^[a-z0-9-]{8,64}$/i.test(String(input.visitorId || "")) ? input.visitorId : "",
    house: t(input.house, 120), project: t(input.project, 120), town: t(input.town, 120), photo: t(input.photo, 500),
    date: "", slot: "", note: t(input.note, 500), source: ["form", "chat", "owner"].includes(input.source) ? input.source : "chat",
    lastMessages: (Array.isArray(input.lastMessages) ? input.lastMessages : []).slice(-5).map((m) => ({ from: m.role === "user" ? "customer" : "bot", text: t(m.content, 400) })),
  };
  if (type === "visit") {
    if (r.name.length < 2) throw new Error("Please type your full name.");
    if (!validMobile(r.mobile)) throw new Error("Please type an 11-digit mobile number, like 0917 123 4567.");
    settings ||= await loadVisitSettings();
    requests ||= await listRequests();
    const problem = input.source === "owner" ? (DATE.test(String(input.date)) && settings.slots[input.slot] ? "" : "Please pick a date and a time.") : slotProblem(settings, requests, input.date, input.slot, now);
    if (problem) throw new Error(problem);
    r.date = input.date;
    r.slot = input.slot;
  }
  let id, made;
  if (useApex()) {
    // APEX checks the slot again and saves it; the owner decides on the Visit requests page
    const saved = Object.fromEntries(Object.entries(await apex("request", r)).map(([k, v]) => [k, v ?? ""])); // Oracle sends empty text as null
    made = { ...saved, photo: r.photo, history: [] };
    id = made.id;
  } else {
    id = crypto.randomBytes(6).toString("hex");
    const row = await writeFile(id, "new", r);
    made = build([row]);
  }
  if (input.source === "owner" && type === "visit" && !useApex()) await writeFile(id, "ev", { action: "approve", note: "Added by the owner" });
  // urgent: a customer is waiting for the owner's decision (an alert on every device that turned them on)
  else await notifyOwner({
    title: type === "visit" ? "New site visit request" : TYPES[type],
    body: [r.name || "A customer", r.house, type === "visit" ? `${niceDate(r.date)}, ${settings.slots[r.slot] || r.slot}` : r.mobile].filter(Boolean).join(" · "),
    url: "/#approvals", tag: `req-${id}`,
  });
  return made;
}

export async function decide(id, { action, date = "", slot = "", note = "" }, { now = Date.now() } = {}) {
  if (!["approve", "suggest", "decline", "handled", "reopen"].includes(action)) throw new Error("Unknown action");
  const requests = await listRequests();
  const r = requests.find((x) => x.id === id);
  if (!r) throw new Error("Request not found");
  if (action === "suggest") {
    const problem = slotProblem(await loadVisitSettings(), requests, date, slot, now, id);
    if (problem) throw new Error(problem);
  }
  await writeFile(id, "ev", { action, date: action === "suggest" ? date : "", slot: action === "suggest" ? slot : "", note: t(note, 300) });
  return getRequest(id);
}

// ---------- what the customer is told (Taglish, as the spec writes it) ----------
const houseLine = (r) => [r.house, r.project, r.town].filter(Boolean).join(", ");
const when = (date, slot, settings) => `${niceDate(date)}, ${settings.slots[slot] || slot}`;
export function customerMessage(r, settings) {
  const hi = r.name ? `, ${r.name.split(/\s+/)[0]}` : "";
  const sa = houseLine(r) ? ` sa ${houseLine(r)}` : "";
  if (r.status === "pending" && r.type === "visit") return `Salamat po${hi}! Na-send na po namin sa owner ang site visit request ninyo${houseLine(r) ? ` para sa ${houseLine(r)}` : ""} sa ${when(r.date, r.slot, settings)}. Hinihintay pa po ang confirmation, at ite-text o tatawagan po namin kayo sa ${r.mobile} kapag approved na.`;
  if (r.status === "approved" && r.type === "visit") return `Good news po${hi}! Approved na po ang site visit ninyo${sa} sa ${when(r.date, r.slot, settings)}. Please save our numbers: ${PHONES}. Text or call po kayo anytime kung may tanong o kailangan ninyong i-resched.`;
  if (r.status === "suggested") return `Pasensya na po${hi}, hindi available ang ${when(r.date, r.slot, settings)}. Pwede po ba kayo sa ${when(r.suggestedDate, r.suggestedSlot, settings)}? Paki-reply lang po o i-text kami sa ${PHONES}.`;
  if (r.status === "declined") return `Pasensya na po${hi}, hindi po namin ma-confirm ${r.type === "visit" ? `ang site visit sa ${when(r.date, r.slot, settings)}` : "ang request ninyo"} ngayon.${r.ownerNote ? ` ${r.ownerNote}` : ""} Tawagan o i-text po kami sa ${PHONES} para matulungan namin kayo.`;
  return "";
}

// which kind of request a bot handover is, from what the customer wrote last
export function handoverType(messages) {
  const said = messages.filter((m) => m.role === "user").slice(-3).map((m) => m.content).join(" ").toLowerCase();
  if (/reserv|i-reserve|ireserve/.test(said)) return "reservation";
  if (/discount|promo|qualif|approve|approval|pasok ba/.test(said)) return "discount";
  if (/magkano|presyo|price|how much/.test(said)) return "price";
  if (/visit|bisita|tripping|tingnan|puntahan/.test(said)) return "visit";
  return "person";
}
