// Self-check with fake Facebook + LLM: node test.mjs
import assert from "node:assert/strict";
import crypto from "node:crypto";

Object.assign(process.env, { VERIFY_TOKEN: "vt", PAGE_ACCESS_TOKEN: "pat", APP_SECRET: "sec", GROQ_API_KEY: "g", LLM_API_KEY: "k", ADMIN_PASSWORD: "pw" });
delete process.env.BLOB_READ_WRITE_TOKEN; // no store locally, so settings fall back to defaults
const calls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  if (url.startsWith("https://site.test/")) {
    return new Response("<html><head><title>Projects &amp; Prices</title><style>x{}</style></head><body><script>bad()</script><h1>Pampanga</h1><p>Lot from 1.2M. Rent-to-own available for qualified buyers.</p></body></html>");
  }
  if (!url.includes("chat/completions") && !url.includes("graph.facebook.com")) return realFetch(url, opts);
  if (url.includes("/me/conversations")) {
    // the user's inbox, newest first; includes the message being answered
    if (!url.includes("user_id=u1")) return new Response("no access", { status: 403 });
    return Response.json({ data: [{ messages: { data: [
      { id: "m3", message: "hello", from: { id: "u1" } },
      { id: "m2", message: "Hi! Saan po kayo naghahanap?", from: { id: "page" } },
      { id: "m1", message: "may bahay ba sa Tarlac", from: { id: "u1" } },
    ] } }] });
  }
  calls.push({ url, body: JSON.parse(opts.body) });
  if (url.includes("chat/completions")) return Response.json({ choices: [{ message: { content: " Hi there! " } }] });
  return Response.json({});
};

const webhook = await import("./api/webhook.js");
const chat = await import("./api/chat.js");
const settings = await import("./api/settings.js");
const { buildPrompt, DEFAULT_SETTINGS } = await import("./lib/bot.js");

// webhook verification
assert.equal(await (await webhook.GET(new Request("https://x/?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=123"))).text(), "123");
assert.equal((await webhook.GET(new Request("https://x/?hub.mode=subscribe&hub.verify_token=no&hub.challenge=1"))).status, 403);

// incoming message: one real text, one echo, one sticker
const raw = JSON.stringify({ object: "page", entry: [{ messaging: [
  { sender: { id: "u1" }, recipient: { id: "page" }, message: { mid: "m3", text: "hello" } },
  { sender: { id: "page" }, message: { text: "echo", is_echo: true } },
  { sender: { id: "u2" }, message: { attachments: [] } },
] }] });
const sig = "sha256=" + crypto.createHmac("sha256", "sec").update(raw).digest("hex");
assert.equal((await webhook.POST(new Request("https://x/", { method: "POST", body: raw, headers: { "x-hub-signature-256": sig } }))).status, 200);
assert.deepEqual(calls.map((c) => c.body.recipient?.id ?? "llm"), ["u1", "llm", "u1"]);
assert.equal(calls[2].body.message.text, "Hi there!");
assert.match(calls[1].body.messages[0].content, /Grab A House/);
assert.match(calls[1].body.messages[0].content, /don't repeat or restate the customer's question/);
// earlier messages from the inbox come first, oldest to newest, then the new message once
assert.deepEqual(calls[1].body.messages.slice(1), [
  { role: "user", content: "may bahay ba sa Tarlac" },
  { role: "assistant", content: "Hi! Saan po kayo naghahanap?" },
  { role: "user", content: "hello" },
]);
// inbox can't be read: still answers, just without history
calls.length = 0;
const raw3 = JSON.stringify({ object: "page", entry: [{ messaging: [{ sender: { id: "u3" }, recipient: { id: "page" }, message: { mid: "x", text: "hi" } }] }] });
await webhook.POST(new Request("https://x/", { method: "POST", body: raw3, headers: { "x-hub-signature-256": "sha256=" + crypto.createHmac("sha256", "sec").update(raw3).digest("hex") } }));
assert.deepEqual(calls[1].body.messages.slice(1), [{ role: "user", content: "hi" }]);
assert.equal(calls[2].body.message.text, "Hi there!");
assert.equal((await webhook.POST(new Request("https://x/", { method: "POST", body: raw, headers: { "x-hub-signature-256": "sha256=00" } }))).status, 401);

// admin APIs need the password
const auth = { authorization: "Bearer pw" };
assert.equal((await settings.GET(new Request("https://x/"))).status, 401);
assert.equal((await settings.GET(new Request("https://x/", { headers: { authorization: "Bearer nope" } }))).status, 401);
assert.equal((await settings.GET(new Request("https://x/", { headers: auth }))).status, 200);
assert.equal((await chat.POST(new Request("https://x/", { method: "POST", body: "{}" }))).status, 401);

// test chat uses the unsaved settings from the form, with history
calls.length = 0;
const res = await chat.POST(new Request("https://x/", { method: "POST", headers: auth, body: JSON.stringify({
  settings: { botName: "Tester" }, messages: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }, { role: "user", content: "c" }],
}) }));
assert.deepEqual(await res.json(), { reply: "Hi there!" });
assert.match(calls[0].body.messages[0].content, /You are Tester/);
assert.equal(calls[0].body.messages.length, 4);

// empty optional fields are left out of the prompt; knowledge base sources go in with titles
assert.doesNotMatch(buildPrompt({ ...DEFAULT_SETTINGS, knowledge: "", rules: "" }), /Key facts|Rules:|Knowledge base:/);
assert.match(buildPrompt({ ...DEFAULT_SETTINGS, sources: [{ title: "FAQ", content: "Reservation fee is 10k" }] }), /### FAQ\nReservation fee is 10k/);

// houses for sale: listed with their details; prices only when the bot may share them
const { cleanSettings, houseText, LEAD_QUESTIONS } = await import("./lib/bot.js");
const today = new Date("2026-10-19");
const pagibig = { financing: "Pag-IBIG", price: "1,200,000", reservation: "5,000", processingFee: "130,000", processingMonths: "12", equity: "41,190.00", equityMonths: "12", loanValue: "1,158,810.00", monthly: "7,600.94", term: "30" };
const bank = { financing: "Bank", price: "1,250,000", monthly: "9,000", term: "20" };
const bella = { name: "Bella model", project: "Mansfield Residences", area: "Pampanga", town: "Mabalacat", status: "available", bedrooms: "2", asOf: "2026-10-01", options: [pagibig, bank] };
const sold = { name: "Rosa model", area: "Tarlac", status: "sold out", options: [{ financing: "", price: "₱2M" }] };
const shared = buildPrompt({ ...DEFAULT_SETTINGS, houses: [bella, sold] }, today);
assert.match(shared, /^- Bella model \(Mansfield Residences\): Area: Pampanga; Town\/city: Mabalacat; Status: available; Bedrooms: 2; Info as of: 2026-10-01$/m);
assert.match(shared, /^  Pag-IBIG: Total price 1,200,000; Reservation fee 5,000; Processing fee 130,000 \(payable over 12 months\); Equity 41,190\.00 \(payable over 12 months\); Loan value 1,158,810\.00; Monthly amortization 7,600\.94; Term 30 years$/m);
assert.match(shared, /^  Bank: Total price 1,250,000; Monthly amortization 9,000; Term 20 years$/m);
assert.match(shared, /^- Rosa model: Area: Tarlac; Status: sold out\n  Payment: Total price ₱2M$/m);
assert.match(shared, /You may share the prices/);
// a computation request gets the full computation, only in share mode with houses
assert.match(shared, /asks for a computation, send the full computation .* one item per line/);
const agentOnly = buildPrompt({ ...DEFAULT_SETTINGS, pricing: "agent", houses: [bella] }, today);
assert.match(agentOnly, /^- Bella model \(Mansfield Residences\): Area: Pampanga; Town\/city: Mabalacat; Status: available; Bedrooms: 2; Info as of: 2026-10-01; Financing: Pag-IBIG, Bank$/m);
assert.doesNotMatch(agentOnly, /₱|1,200,000|You may share|computation, send/);
assert.match(agentOnly, /Never share prices/);
assert.doesNotMatch(buildPrompt({ ...DEFAULT_SETTINGS, houses: [] }, today), /computation, send/);
// old prices are flagged, recent ones are not
assert.match(houseText({ ...bella, asOf: "2026-09-01" }, "share", today), /^- Bella model .*Info as of: 2026-09-01 \(prices as of 2026-09-01, older than 30 days\)\n/);
const stalePrompt = buildPrompt({ ...DEFAULT_SETTINGS, houses: [{ ...bella, asOf: "2026-09-01" }] }, today);
assert.match(stalePrompt, /as of that date and an agent will confirm the latest price/);
assert.doesNotMatch(shared.split("\n").filter((l) => l.startsWith("- Bella")).join(), /older than/);
assert.doesNotMatch(houseText({ ...bella, asOf: "2026-09-19" }, "share", today), /older than/); // exactly 30 days
// no houses: no listings section, and no permission to quote prices
assert.doesNotMatch(buildPrompt(DEFAULT_SETTINGS), /Houses for sale|You may share/);
// buyer questions: only the ticked ones, none when nothing is ticked
assert.match(buildPrompt({ ...DEFAULT_SETTINGS, leadQuestions: ["budget", "contact"] }), /find out their budget or target monthly payment, name and mobile number\./);
assert.doesNotMatch(buildPrompt({ ...DEFAULT_SETTINGS, leadQuestions: [] }), /find out their/);
assert.equal(LEAD_QUESTIONS.payment, "how they plan to pay (Pag-IBIG, bank or in-house financing)");
assert.equal(DEFAULT_SETTINGS.fallback, "Pasensya na po, hindi ako makasagot ngayon. Paki-try ulit mamaya, o tumawag sa 0932 424 4949.");
// saving keeps known fields only, fixes odd values, and counts houses toward the size cap
const cleaned = cleanSettings({ pricing: "free", leadQuestions: ["budget", "shoe size"], houses: [{ name: " Bella ", status: "maybe", hack: "x" }] });
assert.equal(cleaned.pricing, "share");
assert.deepEqual(cleaned.leadQuestions, ["budget"]);
assert.equal(cleaned.houses[0].name, "Bella");
assert.equal(cleaned.houses[0].status, "available");
assert.equal(cleaned.houses[0].hack, undefined);
assert.deepEqual(cleaned.houses[0].options, []);
// old-format houses become one option and lose the old money fields
const [oldHouse] = cleanSettings({ houses: [{ name: "Old", price: "1M", reservation: "5k", downPayment: "50k", monthly: "8k" }] }).houses;
assert.equal(oldHouse.options.length, 1);
assert.deepEqual({ ...oldHouse.options[0] }, { financing: "", price: "1M", reservation: "5k", processingFee: "", equity: "50k", loanValue: "", monthly: "8k", term: "", processingMonths: "", equityMonths: "" });
for (const k of ["price", "reservation", "downPayment", "monthly"]) assert.equal(k in oldHouse, false);
// options: first of each financing type, empty ones dropped, at most 3
const opts = cleanSettings({ houses: [{ name: "X", options: [{ financing: "Bank", price: "1" }, { financing: "Bank", price: "2" }, { financing: "Pag-IBIG" }, { financing: "Pag-IBIG", price: "3" }, { price: "4" }, { financing: "In-house", price: "5" }] }] }).houses[0].options;
assert.deepEqual(opts.map((o) => [o.financing, o.price]), [["Bank", "1"], ["Pag-IBIG", "3"], ["", "4"]]);
// an old-format house that was never re-saved still shows its prices
assert.match(houseText({ name: "Legacy", price: "1M", downPayment: "50k" }, "share", today), /^- Legacy\n  Payment: Total price 1M; Equity 50k$/);
assert.equal(cleanSettings({ pricing: "agent" }).pricing, "agent");
assert.throws(() => cleanSettings({ houses: Array.from({ length: 200 }, () => ({ name: "x", notes: "y".repeat(1000) })) }), /too big/);

// setup checklist: Facebook stays "not public" until FACEBOOK_PUBLIC is set
const status = await import("./api/status.js");
delete process.env.FACEBOOK_PUBLIC;
assert.equal((await (await status.GET(new Request("https://x/", { headers: auth }))).json()).facebookPublic, false);

// website import strips scripts/styles/tags and decodes entities
const imp = await import("./api/import.js");
assert.equal((await imp.POST(new Request("https://x/", { method: "POST", body: '{"url":"https://site.test/"}' }))).status, 401);
assert.equal((await imp.POST(new Request("https://x/", { method: "POST", headers: auth, body: '{"url":"ftp://nope"}' }))).status, 400);
const page = await (await imp.POST(new Request("https://x/", { method: "POST", headers: auth, body: '{"url":"https://site.test/"}' }))).json();
assert.equal(page.title, "Projects & Prices");
assert.match(page.content, /Pampanga\nLot from 1\.2M/);
assert.doesNotMatch(page.content, /bad\(\)|x\{\}/);

// fallback chain: Groq models in order, then Gemini; a busy (503), used-up (429) or missing (404) model is skipped, not retried
const { askLLM, PROVIDERS } = await import("./lib/bot.js");
const CHAIN = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b", "gemini-3.8-flash"];
assert.deepEqual(PROVIDERS.map((p) => p.model), CHAIN);
const okFetch = globalThis.fetch;
const tried = [];
let failures = [429, 503, 404];
globalThis.fetch = async (url, opts) => {
  if (!String(url).includes("chat/completions")) return okFetch(url, opts);
  tried.push(JSON.parse(opts.body).model);
  const status = failures.shift();
  return status ? new Response("nope", { status }) : okFetch(url, opts);
};
assert.equal(await askLLM(DEFAULT_SETTINGS, [{ role: "user", content: "hi" }]), "Hi there!");
assert.deepEqual(tried, CHAIN);
assert.equal(calls.at(-1).body.reasoning_effort, undefined); // Gemini gets no extra options
// all models down: every model's error comes through
failures = [429, 429, 404, 503];
await assert.rejects(askLLM(DEFAULT_SETTINGS, [{ role: "user", content: "hi" }]), /LLM 429 \[openai\/gpt-oss-120b\].*LLM 503 \[gemini-3\.8-flash\]/);
// first model works: only one request, told to think briefly
tried.length = 0;
calls.length = 0;
await askLLM(DEFAULT_SETTINGS, [{ role: "user", content: "hi" }]);
assert.deepEqual(tried, ["openai/gpt-oss-120b"]);
assert.equal(calls.at(-1).body.reasoning_effort, "low");
// thinking text is stripped; a reply that is only thinking counts as a failure and moves on
globalThis.fetch = async (url, opts) => {
  if (!String(url).includes("chat/completions")) return okFetch(url, opts);
  const model = JSON.parse(opts.body).model;
  const content = model === "openai/gpt-oss-120b" ? "<think>hmm</think>" : "<think>let me see</think> Hello po!";
  return Response.json({ choices: [{ message: { content } }] });
};
assert.equal(await askLLM(DEFAULT_SETTINGS, [{ role: "user", content: "hi" }]), "Hello po!");

console.log("all checks passed");
