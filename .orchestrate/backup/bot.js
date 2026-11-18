import crypto from "node:crypto";
import { del, head, list, put } from "@vercel/blob";

const {
  GROQ_API_KEY,
  GROQ_MODELS = "openai/gpt-oss-120b,qwen/qwen3.8-27b,openai/gpt-oss-20b",
  LLM_API_KEY,
  LLM_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai",
  LLM_MODEL = "gemini-3.8-flash",
  ADMIN_PASSWORD,
} = process.env;

// Tried in order. Each model has its own free-tier limit, so when one is busy or used up
// the next one answers: Groq's models in order, then Gemini as last backup.
// No reply-length cap: these models "think" first and that counts toward it; the prompt keeps replies short.
export const PROVIDERS = [
  ...(GROQ_API_KEY
    ? GROQ_MODELS.split(",").map((model) => ({
        url: "https://api.groq.com/openai/v1",
        key: GROQ_API_KEY,
        model: model.trim(),
        extra: model.includes("gpt-oss") ? { reasoning_effort: "low" } : {}, // think briefly: faster, uses less of the limit
      }))
    : []),
  ...(LLM_API_KEY ? [{ url: LLM_BASE_URL, key: LLM_API_KEY, model: LLM_MODEL, extra: {} }] : []),
];

// Each save is a new file (unique URL), so the CDN never serves an old copy; the newest one wins.
const SETTINGS_PREFIX = "settings/";
const LEGACY_PATH = "settings.json"; // where settings lived before versioned saves

export const DEFAULT_SETTINGS = {
  botName: "Grab A House Assistant",
  business:
    "Grab A House is a real estate agent offering rent-to-own house and lot in Pampanga, Tarlac, Bataan and Subic. Buyers can pay through bank financing or Pag-IBIG housing loan. Free site tripping is available by schedule.",
  knowledge: "Contact numbers: 0932 424 4949 (Smart), 0976 229 0328 (Globe).",
  tone: "friendly",
  language: "Reply in the language the customer uses (English, Tagalog or Taglish).",
  rules:
    "Keep replies short. Ask for their preferred location, budget and schedule. Never invent prices, availability or terms; if you don't know, give the contact numbers.",
  fallback: "Pasensya na po, hindi ako makasagot ngayon. Paki-try ulit mamaya, o tumawag sa 0932 424 4949.",
  pricing: "share", // "share": bot may quote listed prices; "agent": prices are left to an agent
  leadQuestions: ["location", "budget", "payment", "employment", "contact", "visit"],
  sources: [], // knowledge base: [{ title, content }]
  houses: [], // listings: [{ name, ...HOUSE_FIELDS }]
};

// What the bot asks interested buyers; Bot Studio shows these as checkboxes.
export const LEAD_QUESTIONS = {
  location: "preferred location",
  budget: "budget or target monthly payment",
  payment: "how they plan to pay (Pag-IBIG, bank or in-house financing)",
  employment: "work situation (employed, self-employed or OFW)",
  contact: "name and mobile number",
  visit: "preferred date for a site visit",
};

// [key, label in the prompt]. The name and project are written separately; prices live in each house's options.
const HOUSE_FIELDS = [
  ["project", ""], ["area", "Area"], ["town", "Town/city"], ["status", "Status"],
  ["lotArea", "Lot area"], ["floorArea", "Floor area"], ["bedrooms", "Bedrooms"], ["bathrooms", "Bathrooms"],
  ["features", "Features"], ["notes", "Notes"], ["asOf", "Info as of"],
];
// [key, label in the prompt]; processingMonths and equityMonths are folded into their fee, and term gets "years"
const OPTION_FIELDS = [
  ["price", "Total price"], ["reservation", "Reservation fee"], ["processingFee", "Processing fee"],
  ["equity", "Equity"], ["loanValue", "Loan value"], ["monthly", "Monthly amortization"], ["term", "Term"],
];
const OPTION_KEYS = [...OPTION_FIELDS.map(([k]) => k), "financing", "processingMonths", "equityMonths"];
const FINANCING_TYPES = ["Pag-IBIG", "Bank", "In-house"];
const MAX_OPTIONS = 3;
const STALE_DAYS = 30;
const HOUSE_STATUSES = ["available", "few units left", "sold out"];

const trim = (v, max = 200) => String(v ?? "").trim().slice(0, max);

// A house's financing options; houses saved before options existed get one from their old money fields.
function optionsOf(h) {
  if (Array.isArray(h.options)) return h.options;
  const old = { financing: "", price: h.price, reservation: h.reservation, equity: h.downPayment, monthly: h.monthly };
  return Object.values(old).some((v) => trim(v)) ? [old] : [];
}

// prices are old when "as of" is more than STALE_DAYS before today
const isStale = (asOf, today) => {
  const t = Date.parse(asOf);
  return !Number.isNaN(t) && (today - t) / 864e5 > STALE_DAYS;
};

export function houseText(h, pricing = "share", today = new Date()) {
  const project = trim(h.project);
  const parts = HOUSE_FIELDS.filter(([k]) => k !== "project")
    .map(([k, label]) => [label, trim(h[k], 1000)])
    .filter(([, v]) => v)
    .map(([label, v]) => `${label}: ${v}`);
  let text = `- ${trim(h.name) || "Unnamed house"}${project ? ` (${project})` : ""}${parts.length ? ": " + parts.join("; ") : ""}`;
  const options = optionsOf(h);
  if (pricing !== "share") {
    const types = options.map((o) => trim(o.financing)).filter(Boolean);
    return types.length ? `${text}; Financing: ${types.join(", ")}` : text;
  }
  if (isStale(trim(h.asOf), today)) text += ` (prices as of ${trim(h.asOf)}, older than ${STALE_DAYS} days)`;
  for (const o of options) {
    const val = (k) => trim(o[k]);
    const line = OPTION_FIELDS.filter(([k]) => val(k)).map(([k, label]) => {
      const months = { processingFee: "processingMonths", equity: "equityMonths" }[k];
      return `${label} ${val(k)}${months && val(months) ? ` (payable over ${val(months)} months)` : ""}${k === "term" ? " years" : ""}`;
    });
    if (line.length) text += `\n  ${val("financing") || "Payment"}: ${line.join("; ")}`;
  }
  return text;
}

// ponytail: whole knowledge base and every listing go into every prompt. Capped so one message (~8K tokens at most)
// fits Groq's free per-minute limit (~12K tokens on the 70B model). Need more? Search-and-send-relevant-parts.
const MAX_KB_CHARS = 30_000;

async function settingsFiles() {
  const { blobs } = await list({ prefix: SETTINGS_PREFIX });
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

// ponytail: Messenger replies reuse settings for up to 10s per server instance, so bursts of
// messages don't each make a Blob list call (a metered operation). Bot Studio always reads fresh.
let cached = { at: 0, value: null };

export async function loadSettings({ fresh = false } = {}) {
  if (!fresh && cached.value && Date.now() - cached.at < 10_000) return cached.value;
  let value = DEFAULT_SETTINGS;
  try {
    const [latest] = await settingsFiles();
    const url = latest?.url ?? (await head(LEGACY_PATH)).url;
    value = { ...DEFAULT_SETTINGS, ...(await (await fetch(url, { cache: "no-store" })).json()) };
  } catch {
    // nothing saved yet
  }
  cached = { at: Date.now(), value };
  return value;
}

// What gets stored: known fields only, trimmed to size. Throws if the knowledge base is too big.
export function cleanSettings(settings) {
  const list = (v) => (Array.isArray(v) ? v : []);
  const clean = Object.fromEntries(
    Object.keys(DEFAULT_SETTINGS)
      .filter((k) => typeof DEFAULT_SETTINGS[k] === "string")
      .map((k) => [k, String(settings[k] ?? "").slice(0, 20000)]),
  );
  clean.pricing = settings.pricing === "agent" ? "agent" : "share";
  clean.leadQuestions = list(settings.leadQuestions).filter((k) => k in LEAD_QUESTIONS);
  clean.sources = list(settings.sources).map((s) => ({
    title: String(s.title ?? "Untitled").slice(0, 200),
    content: String(s.content ?? ""),
  }));
  clean.houses = list(settings.houses).slice(0, 200).map((h) => {
    const house = { name: trim(h.name) };
    for (const [k] of HOUSE_FIELDS) house[k] = trim(h[k], k === "features" || k === "notes" ? 1000 : 200);
    if (!HOUSE_STATUSES.includes(house.status)) house.status = "available";
    const seen = new Set();
    house.options = optionsOf(h)
      .map((o) => Object.fromEntries(OPTION_KEYS.map((k) => [k, trim(o?.[k])])))
      .map((o) => (FINANCING_TYPES.includes(o.financing) ? o : { ...o, financing: "" }))
      .filter((o) => OPTION_FIELDS.some(([k]) => o[k]))
      .filter((o) => !o.financing || (!seen.has(o.financing) && seen.add(o.financing)))
      .slice(0, MAX_OPTIONS);
    return house;
  });
  const total =
    clean.sources.reduce((n, s) => n + s.content.length, 0) + clean.houses.reduce((n, h) => n + houseText(h).length, 0);
  if (total > MAX_KB_CHARS) throw new Error(`Knowledge base too big: ${total} characters (max ${MAX_KB_CHARS})`);
  return clean;
}

export async function saveSettings(settings) {
  const clean = cleanSettings(settings);
  const saved = await put(`${SETTINGS_PREFIX}settings.json`, JSON.stringify(clean), {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
  });
  cached = { at: Date.now(), value: clean };
  // keep the newest file plus two older ones; readers mid-request may still be using those
  const old = (await settingsFiles()).filter((b) => b.url !== saved.url).slice(2);
  if (old.length) await del(old.map((b) => b.url));
  return clean;
}

export function buildPrompt(s, today = new Date()) {
  const houses = Array.isArray(s.houses) ? s.houses : [];
  const leads = (Array.isArray(s.leadQuestions) ? s.leadQuestions : []).map((k) => LEAD_QUESTIONS[k]).filter(Boolean);
  return [
    `You are ${s.botName}, the assistant on this business's Facebook Page.`,
    `About the business:\n${s.business}`,
    s.knowledge && `Key facts:\n${s.knowledge}`,
    s.sources?.length &&
      `Knowledge base:\n${s.sources.map((src) => `### ${src.title}\n${src.content}`).join("\n\n")}`,
    houses.length &&
      `Houses for sale (current listings you may name and describe; they are more specific than the knowledge base, so follow them when the two disagree):\n${houses.map((h) => houseText(h, s.pricing, today)).join("\n")}\nIf a house is sold out, say so and suggest available ones in the same area.`,
    s.pricing === "agent"
      ? "Never share prices or payment amounts. When asked, say an agent will send the latest price and computation."
      : houses.length &&
        "You may share the prices and payment amounts listed above. Say they are as of the date shown and that an agent will confirm the final computation. Never state an amount that isn't listed. For a house marked \"older than 30 days\", still share the amounts, but always say they are as of that date and an agent will confirm the latest price. When a customer asks for a computation, send the full computation for the matching house and financing type as plain text, one item per line (like \"Price - 1,200,000\"), and never invent an item that isn't listed.",
    "Answer only from the business info, key facts, knowledge base and listings above. If the answer isn't there, say you're not sure and share the contact details instead of guessing.",
    leads.length &&
      `When a customer is interested, find out their ${leads.join(", ")}. Ask one or two at a time, and skip anything they already told you.`,
    `Tone: ${s.tone}.`,
    s.language,
    "This is a Facebook Messenger chat: reply in plain text (no markdown, no asterisks or # headings), usually 1-4 short sentences (a full computation may be longer). Answer right away: don't repeat or restate the customer's question.",
    s.rules && `Rules:\n${s.rules}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// messages: [{ role: "user" | "assistant", content }]
export async function askLLM(settings, messages) {
  const chat = [{ role: "system", content: buildPrompt(settings) }, ...messages];
  const errors = [];
  for (const p of PROVIDERS) {
    // a busy or used-up model is skipped at once, never retried: retrying a used-up limit only uses more of it
    try {
      const res = await fetch(`${p.url}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
        body: JSON.stringify({ model: p.model, messages: chat, ...p.extra }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) {
        // some models put their thinking inside <think>...</think>; customers must never see it
        const reply = ((await res.json()).choices?.[0]?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        if (reply) return reply;
        errors.push(`LLM 503 [${p.model}]: empty reply`);
        continue;
      }
      errors.push(`LLM ${res.status} [${p.model}]: ${(await res.text()).replace(/\s+/g, " ").slice(0, 300)}`);
    } catch (err) {
      errors.push(`LLM 503 [${p.model}]: ${err.message}`); // timeout or network error
    }
    console.warn("model failed, trying next:", errors.at(-1));
  }
  throw new Error(errors.join(" | ") || "LLM 401: no API key set");
}

export function isAdmin(request) {
  const given = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  const expected = Buffer.from(ADMIN_PASSWORD ?? "");
  return expected.length > 0 && given.length === expected.length && crypto.timingSafeEqual(given, expected);
}
