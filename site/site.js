// Grab A House public website: shared parts for every page (top bar, footer, house cards, helpers).
// House data comes from /api/public/houses, which Bot Studio fills. Text from data is always set with textContent.
export const PHONES = [["0932 424 4949", "Smart", "09324244949"], ["0976 229 0328", "Globe", "09762290328"]];
export const FACEBOOK = "https://www.facebook.com/grabahouseph";
export const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "style") n.style.cssText = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  n.append(...kids.flat(Infinity).filter((k) => k != null && k !== false));
  return n;
}

const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chat: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  bed: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 14h18M7 9V6h4v3"/>',
  bath: '<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2ZM6 12V6a2 2 0 0 1 4 0"/>',
  area: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
};
export function icon(name) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [k, v] of Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" })) s.setAttribute(k, v);
  s.innerHTML = ICONS[name]; // our own fixed icon paths only
  return s;
}

// ---------- data ----------
let housesPromise;
export function loadHouses() {
  housesPromise ||= fetch("/api/public/houses")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then((d) => d.houses || []);
  return housesPromise;
}
const num = (v) => Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0;
export const priceOf = (h) => (h.options || []).map((o) => o.price).find(Boolean) || "";
export const priceNumber = (h) => num(priceOf(h));
// lowest listed monthly payment, for "from ₱X/month"
export function monthlyOf(h) {
  const m = (h.options || []).filter((o) => num(o.monthly)).sort((a, b) => num(a.monthly) - num(b.monthly))[0];
  return m ? { amount: m.monthly, financing: m.financing } : null;
}
export const place = (h) => [h.town, h.area].filter(Boolean).join(", ");
export const houseUrl = (h) => `/site/house.html?h=${encodeURIComponent(h.slug)}`;
export const peso = (v) => (/^[\d,.]+$/.test(String(v).trim()) ? `₱${v}` : String(v));
const sqm = (v) => (v ? `${v}${/sqm|m²|sq/i.test(v) ? "" : " sqm"}` : "");
const count = (v, word) => (v ? (/[a-z]/i.test(v) ? v : `${v} ${word}${v === "1" ? "" : "s"}`) : "");
export function specs(h) {
  return [["bed", count(h.bedrooms, "bed")], ["bath", count(h.bathrooms, "bath")], ["area", h.floorArea ? `${sqm(h.floorArea)} floor` : h.lotArea ? `${sqm(h.lotArea)} lot` : ""]].filter(([, v]) => v);
}

export function houseCard(h, i = 0) {
  const price = priceOf(h);
  const monthly = monthlyOf(h);
  const photo = h.photos?.[0];
  const sold = h.status === "sold out";
  return el("a", { class: `card rv${sold ? " sold" : ""}`, href: houseUrl(h), style: `--i:${i % 3}` },
    el("div", { class: "ph" },
      photo ? el("img", { src: photo, alt: `${h.name}${h.project ? `, ${h.project}` : ""}`, loading: "lazy", decoding: "async" }) : el("span", { class: "none" }, icon("camera"), "Photos coming soon"),
      el("div", { class: "tags" }, sold ? el("span", { class: "tag sold", text: "Sold out" }) : h.status === "few units left" ? el("span", { class: "tag few", text: "Few units left" }) : null, h.project ? el("span", { class: "tag", text: h.project }) : null),
      h.photos?.length > 1 ? el("span", { class: "tag photos" }, `${h.photos.length} photos`) : null),
    el("div", { class: "info" },
      el("span", { class: `price${price ? "" : " ask"}`, text: price ? peso(price) : "Price on request" }),
      monthly ? el("span", { class: "monthly", text: `from ${peso(monthly.amount)}/month${monthly.financing ? ` (${monthly.financing})` : ""}` }) : null,
      el("h3", { text: h.name }),
      place(h) ? el("span", { class: "where" }, icon("pin"), place(h)) : null,
      el("div", { class: "specs" }, specs(h).map(([ic, v]) => el("span", {}, icon(ic), v)))));
}

export function skeletons(n = 6) {
  return Array.from({ length: n }, () => el("div", { class: "card skel", "aria-hidden": "true" },
    el("div", { class: "ph" }), el("div", { class: "info" }, el("div", { class: "line", style: "width:45%;height:22px" }), el("div", { class: "line", style: "width:70%" }), el("div", { class: "line", style: "width:55%" }))));
}

// ---------- page frame ----------
const LINKS = [["/site/houses.html", "Houses for sale"], ["/site/projects.html", "Projects"], ["/site/about.html", "About & contact"]];

function frame() {
  const here = location.pathname;
  const nav = el("header", { class: "nav" }, el("div", { class: "wrap" },
    el("a", { class: "logo", href: "/site/" }, el("img", { src: "/site/img/logo-64.png", alt: "", width: "40", height: "40" }), "Grab A House"),
    el("nav", { "aria-label": "Main" }, LINKS.map(([href, label]) => el("a", { href, text: label, "aria-current": here === href ? "page" : null }))),
    el("div", { class: "right" },
      el("a", { class: "phone", href: `tel:${PHONES[0][2]}`, "aria-label": `Call ${PHONES[0][0]}` }, icon("phone"), el("span", { text: PHONES[0][0] })),
      el("button", { class: "btn btn-main", "data-chat": "", text: "Inquire now" }),
      el("button", { class: "menu", "aria-label": "Open menu", "aria-expanded": "false", onclick: (e) => { const open = nav.classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", String(open)); } }, icon("menu")))));
  document.body.prepend(nav);

  document.querySelector("main").after(el("footer", { class: "foot" }, el("div", { class: "wrap" },
    el("div", {},
      el("a", { class: "logo", href: "/site/" }, el("img", { src: "/site/img/logo-64.png", alt: "", width: "40", height: "40" }), "Grab A House"),
      el("p", { text: "House and lot in Pampanga, Tarlac, Bataan and Subic. Prices and availability come from the owner; an agent confirms the final computation. No payment is ever taken on this website." })),
    el("div", {},
      el("nav", { "aria-label": "Footer" }, el("a", { href: "/site/houses.html", text: "Houses" }), el("a", { href: "/site/projects.html", text: "Projects" }), el("a", { href: "/site/about.html", text: "Contact" }), el("a", { href: "/site/privacy.html", text: "Privacy policy" })),
      el("p", {}, PHONES.map(([n, net, t], i) => [i ? " · " : "", el("a", { href: `tel:${t}`, text: `${n} (${net})` })])),
      el("p", { text: "© 2026 Grab A House" })))));

  document.body.append(el("button", { class: "btn btn-main fab", "data-chat": "", "aria-label": "Chat with us" }, icon("chat"), "Chat with us"));
}

// chat.js replaces this with the real chat panel; if it fails to load, chat buttons go to the phone numbers.
export let openChat = () => { location.href = "/site/about.html"; };
export function setChat(fn) { openChat = fn; }
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-chat]");
  if (!b) return;
  e.preventDefault();
  // data-visit="<house slug>": open the chat straight to the site-visit form
  openChat(b.dataset.chat || "", b.dataset.visit != null ? { visit: { house: b.dataset.visit } } : undefined);
});

// ---------- motion ----------
const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08 }) : null;
export function reveal(root = document) {
  root.querySelectorAll(".rv:not(.in)").forEach((n) => (io && !reduce ? io.observe(n) : n.classList.add("in")));
}

// closing call-to-action used at the bottom of pages
export function closing() {
  return el("div", { class: "wrap" }, el("div", { class: "cta-band rv" },
    el("div", {}, el("h2", { text: "Found a house you like?" }), el("p", { text: "Ask about prices, payment options or a free site visit. We reply right away, any time." })),
    el("div", { class: "acts" },
      el("button", { class: "btn btn-main btn-block", "data-chat": "", text: "Inquire now" }),
      PHONES.map(([n, net, t]) => el("a", { class: "tel", href: `tel:${t}` }, n, el("small", { text: net }))))));
}

frame();
import("/site/chat.js"); // the chat panel; until it loads, chat buttons go to the contact page
