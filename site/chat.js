// The website chat panel: opens from any [data-chat] button, talks to /api/public/chat, and remembers the chat on this device.
// Bot text is always inserted with textContent (never as HTML).
import { el, icon, setChat, peso, reduce, loadHouses } from "/site/site.js";

const NOTICE = "Hi! Ako po ang AI assistant ng Grab A House, hindi po totoong tao. Sumasagot ako base sa impormasyon ng Grab A House at maaari akong magkamali, kaya paki-confirm po ang presyo at availability sa aming agent. Libre po ito at walang bayad na kinukuha dito.";
const HELLO = "Saang area po kayo naghahanap ng bahay?";
const QUICK = ["What houses are available in Porac?", "Do you have houses in Mabalacat?", "I'd like a site visit", "What are the requirements?"];
const KEY = "gah.chat.v1";

const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode: chat still works, just isn't remembered */ } },
};
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);
let state = store.get();
if (!state?.visitorId) state = { visitorId: newId(), log: [] };
// keep 12 months at most on the device too
state.log = (state.log || []).filter((m) => Date.now() - (m.at || 0) < 365 * 864e5);

// ---------- panel ----------
const log = el("div", { class: "chat-log", role: "log", "aria-live": "polite" });
const input = el("textarea", { rows: "1", placeholder: "Type your question...", "aria-label": "Your message", maxlength: "500", autocomplete: "off" });
const send = el("button", { class: "chat-send", type: "submit", "aria-label": "Send" }, icon("arrow"));
const quick = el("div", { class: "chat-quick" }, QUICK.map((q) => el("button", { type: "button", class: "chip", text: q, onclick: () => ask(q) })));
const form = el("form", { class: "chat-form" },
  el("input", { type: "text", name: "website", tabindex: "-1", autocomplete: "off", class: "hp", "aria-hidden": "true" }), // bots fill this in, people don't see it
  input, send);
const bigBtn = el("button", { type: "button", class: "chat-icon", "aria-label": "Full screen", onclick: () => panel.classList.toggle("full") }, el("span", { text: "⤢", "aria-hidden": "true" }));
const closeBtn = el("button", { type: "button", class: "chat-icon", "aria-label": "Close chat", onclick: () => close() }, el("span", { text: "✕", "aria-hidden": "true" }));
const panel = el("div", { class: "chat glass", role: "dialog", "aria-label": "Chat with our assistant", "aria-modal": "false", hidden: true },
  el("header", { class: "chat-head" },
    el("img", { src: "/site/img/logo-64.png", alt: "", width: "40", height: "40" }),
    el("div", {}, el("b", { text: "Grab A House assistant" }), el("small", {}, el("i", { class: "live" }), "AI assistant · replies in seconds")),
    el("div", { class: "chat-tools" }, bigBtn, closeBtn)),
  log, quick, form,
  el("p", { class: "chat-fine" }, "AI can be wrong; an agent confirms prices. No payment is taken here. ", el("a", { href: "/site/privacy.html", text: "Privacy" })));
const scrim = el("div", { class: "chat-scrim", hidden: true, onclick: () => close() });
document.body.append(scrim, panel);

function bubble(who, text, extra = []) {
  const b = el("div", { class: `bub ${who}` }, text ? el("p", { text }) : null, ...extra);
  log.append(b);
  requestAnimationFrame(() => b.classList.add("on"));
  log.scrollTop = log.scrollHeight;
  return b;
}
function pics(urls) {
  return urls.length ? el("div", { class: "chat-pics" }, urls.map((u, i) => el("a", { href: u, target: "_blank", rel: "noopener" }, el("img", { src: u, alt: `Photo ${i + 1}`, loading: "lazy" })))) : null;
}
// compact house cards: 3 shown, the rest behind "Show N more"
function cards(hs) {
  if (!hs.length) return null;
  const card = (h) => el("a", { class: "mini-card", href: `/site/house.html?h=${encodeURIComponent(h.slug)}` },
    h.photo ? el("img", { src: h.photo, alt: "", loading: "lazy" }) : el("span", { class: "noimg" }),
    el("span", { class: "mc-txt" }, el("b", { text: h.name }), el("small", { text: [h.town, h.project].filter(Boolean).join(" · ") })),
    el("em", { class: h.price ? "" : "ask", text: h.price ? peso(h.price) : "Ask price" }));
  const box = el("div", { class: "chat-cards" }, hs.slice(0, 3).map(card));
  if (hs.length > 3) {
    const more = el("button", { type: "button", class: "mc-more", text: `Show ${hs.length - 3} more` });
    more.onclick = () => more.replaceWith(...hs.slice(3).map(card));
    box.append(more);
  }
  return box;
}
function render() {
  log.replaceChildren();
  bubble("note", NOTICE);
  if (!state.log.length) bubble("bot", HELLO);
  for (const m of state.log) show(m);
  quick.hidden = state.log.length > 0;
}
function show(m) {
  if (m.role === "owner") return bubble("bot team", m.content, [el("small", { class: "who", text: "Grab A House team" })]);
  const b = bubble(m.role === "user" ? "me" : "bot", m.content, [pics(m.photos || []), cards(m.houses || [])].filter(Boolean));
  // the newest bot message asked for a visit and it isn't booked yet: show the form under it
  if (m.visit && !m.booked && m === state.log.filter((x) => x.role === "assistant").at(-1)) b.append(visitForm(m));
  return b;
}

// ---------- site visit form: only open days and free times; the owner confirms ----------
function visitForm(m) {
  const msg = el("p", { class: "vf-msg", role: "alert", hidden: true });
  const house = el("select", { name: "house", "aria-label": "House" }, el("option", { value: "", text: "Not sure yet / any house" }));
  const date = el("select", { name: "date", "aria-label": "Date", required: true }, el("option", { value: "", text: "Loading dates..." }));
  const slot = el("select", { name: "slot", "aria-label": "Time", required: true });
  const name = el("input", { name: "name", type: "text", placeholder: "Full name", autocomplete: "name", maxlength: "80", required: true });
  const mobile = el("input", { name: "mobile", type: "tel", placeholder: "Mobile number (0917 123 4567)", autocomplete: "tel", inputmode: "tel", maxlength: "20", required: true });
  const go = el("button", { class: "btn btn-main btn-block", type: "submit", text: "Send visit request" });
  const f = el("form", { class: "vf" },
    el("b", { text: "Request a free site visit" }),
    el("label", {}, "House", house), el("label", {}, "Date", date), el("label", {}, "Time", slot),
    el("label", {}, "Your name", name), el("label", {}, "Mobile number", mobile),
    msg, go, el("small", { text: "The owner confirms every visit, then texts or calls you. No payment needed." }));
  let days = [];
  const fillSlots = () => {
    const d = days.find((x) => x.date === date.value);
    slot.replaceChildren(...(d ? d.slots : []).map((s) => el("option", { value: s.id, disabled: s.full, text: s.full ? `${s.label} (full)` : s.label })));
    const free = d?.slots.find((s) => !s.full);
    if (free) slot.value = free.id;
  };
  date.addEventListener("change", fillSlots);
  loadHouses().then((hs) => {
    hs.filter((h) => h.status !== "sold out").forEach((h) => house.append(el("option", { value: h.slug, text: [h.name, h.project].filter(Boolean).join(", ") })));
    house.value = m.visit.house || "";
  }).catch(() => {});
  fetch("/api/public/visit", { cache: "no-store" }).then((r) => r.json()).then((data) => {
    days = (data.days || []).filter((d) => d.slots.some((s) => !s.full));
    date.replaceChildren(...(days.length ? days.map((d) => el("option", { value: d.date, text: d.label })) : [el("option", { value: "", text: "No open dates. Please call us." })]));
    fillSlots();
  }).catch(() => date.replaceChildren(el("option", { value: "", text: "Couldn't load dates. Please call us." })));
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.hidden = true;
    go.disabled = true; go.textContent = "Sending...";
    try {
      const res = await fetch("/api/public/visit", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: state.visitorId, house: house.value, date: date.value, slot: slot.value, name: name.value, mobile: mobile.value,
          page: location.pathname + location.search, website: form.elements.website.value, messages: state.log.slice(-5).map(({ role, content }) => ({ role, content })) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.message) throw new Error(data.error || "Couldn't send the request. Please try again, or call 0932 424 4949.");
      m.booked = true;
      const done = { role: "assistant", content: data.message, handover: true, at: Date.now() };
      state.log.push(done);
      store.set(state);
      f.remove();
      show(done);
    } catch (err) {
      msg.textContent = err.message; msg.hidden = false;
      go.disabled = false; go.textContent = "Send visit request";
    }
  });
  return f;
}

// ---------- replies from the Grab A House team (Bot Studio Inbox) ----------
// Checked once when the chat opens, then every 20 s while it's open, only after a handover or a team reply,
// and only for 20 minutes after the last message (each check is a small storage read).
const watching = () => state.ownerAt || state.log.some((m) => m.handover);
const lastAt = () => Math.max(0, ...state.log.map((m) => m.at || 0));
let checking = false;
async function checkTeam() {
  if (checking) return;
  checking = true;
  try {
    const res = await fetch(`/api/public/chat?v=${encodeURIComponent(state.visitorId)}&after=${encodeURIComponent(state.seenAt || "")}`, { cache: "no-store" });
    if (!res.ok) return;
    const { owner = [], markAt = "" } = await res.json();
    for (const o of owner) {
      const m = { role: "owner", content: o.text, at: Date.parse(o.at) || Date.now() };
      state.log.push(m);
      if (!panel.hidden) show(m);
      state.ownerAt = o.at;
    }
    if (markAt) state.markAt = markAt;
    state.seenAt = [state.seenAt, markAt, ...owner.map((o) => o.at)].filter(Boolean).sort().at(-1) || state.seenAt;
    store.set(state);
  } catch { /* try again on the next round */ } finally { checking = false; }
}
setInterval(() => { if (!panel.hidden && !busy && watching() && Date.now() - lastAt() < 20 * 60_000) checkTeam(); }, 20_000);

let busy = false;
async function ask(text) {
  text = String(text || "").trim().slice(0, 500);
  if (!text || busy) return;
  busy = true; send.disabled = true; quick.hidden = true;
  state.log.push({ role: "user", content: text, at: Date.now() });
  store.set(state);
  bubble("me", text); // shows at once (optimistic)
  const dots = bubble("bot typing", null, [el("span", { class: "dots", "aria-label": "Typing" }, el("i"), el("i"), el("i"))]);
  try {
    const res = await fetch("/api/public/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      // team replies go to the bot as its own side of the chat, so it knows what the team said
      body: JSON.stringify({ visitorId: state.visitorId, page: location.pathname + location.search, website: form.elements.website.value, ownerAt: state.ownerAt || "", markAt: state.markAt || "",
        messages: state.log.map(({ role, content }) => ({ role: role === "owner" ? "assistant" : role, content })) }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.quiet) { // the team is talking with this customer: no bot reply, the team answers here
      dots.remove();
      bubble("note", "Natanggap po ng Grab A House team ang mensahe ninyo. Dito po sila sasagot.");
      return;
    }
    if (!data.reply) throw new Error(res.status);
    dots.remove();
    const m = { role: "assistant", content: data.reply, photos: data.photos || [], houses: data.houses || [], handover: !!data.handover, visit: data.visit || null, at: Date.now() };
    state.log.push(m);
    store.set(state);
    show(m);
  } catch {
    dots.remove();
    state.log.pop(); store.set(state);
    bubble("bot", "Hindi po pumasok ang mensahe. Paki-try ulit, o tumawag po sa 0932 424 4949.");
  } finally {
    busy = false; send.disabled = false;
    if (matchMedia("(min-width: 700px)").matches) input.focus();
  }
}

let lastFocus = null;
function open(question, opts = {}) {
  if (panel.hidden) {
    lastFocus = document.activeElement;
    panel.hidden = false; scrim.hidden = false;
    render();
    if (state.log.length) checkTeam(); // a team reply may have come while the customer was away
    requestAnimationFrame(() => { panel.classList.add("open"); scrim.classList.add("open"); });
    document.documentElement.classList.add("chat-open");
  }
  if (opts.visit) { // "Book a free site visit": the form right away, no AI call
    const m = { role: "assistant", content: "Pumili lang po ng araw at oras. Ang owner po ang magko-confirm ng visit ninyo.", visit: opts.visit, at: Date.now() };
    state.log.push(m); store.set(state); quick.hidden = true;
    show(m).scrollIntoView?.({ block: "start" });
  } else if (question) ask(question);
  else setTimeout(() => input.focus(), reduce ? 0 : 250);
}
function close() {
  panel.classList.remove("open", "full"); scrim.classList.remove("open");
  document.documentElement.classList.remove("chat-open");
  setTimeout(() => { if (!panel.classList.contains("open")) { panel.hidden = true; scrim.hidden = true; } }, reduce ? 0 : 320);
  lastFocus?.focus?.();
}
form.addEventListener("submit", (e) => { e.preventDefault(); const t = input.value; input.value = ""; input.style.height = ""; ask(t); });
input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
input.addEventListener("input", () => { input.style.height = ""; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });

setChat(open);
