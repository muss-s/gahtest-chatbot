// Local Bot Studio preview (admin password "preview"): settings kept in memory, fake bot replies. Usage: node preview.mjs .
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = process.argv[2];
process.env.ADMIN_PASSWORD = "preview";
delete process.env.BLOB_READ_WRITE_TOKEN;
const bot = await import(pathToFileURL(path.join(dir, "lib/bot.js")));
let saved = { ...bot.DEFAULT_SETTINGS };
let demoPaused = false;
// sample houses for the website preview when nothing is saved (fictional, preview only)
const blob = (id) => `https://ilokxrwttyxfcnrb.public.blob.vercel-storage.com/photos/house-${id}.jpg`;
const PREVIEW_HOUSES = [
  { name: "Sample End Unit", project: "Sample Homes", town: "Porac", area: "Pampanga", bedrooms: "2", bathrooms: "1", lotArea: "41.25 sqm", floorArea: "34.6 sqm", asOf: "2026-11-13", status: "available", photos: [blob("RK6cSx0Mh1nqIF6zQK1gMYYAeXQUmJ"), blob("sr2y7jIaucSamy84CqjJedOeXlDviG"), blob("AhGcRyGM16481RINe1ow1BMCayvAyp")], options: [{ financing: "Pag-IBIG", price: "1,350,000", reservation: "10,000", monthly: "9,374.15", term: "20" }, { financing: "Bank", price: "1,350,000", monthly: "10,011.73", term: "15" }], notes: "INTERNAL NOTE, must not show" },
  { name: "Sample Duplex", project: "Sample Residences", town: "Mabalacat", area: "Pampanga", bedrooms: "3", bathrooms: "2", lotArea: "90 sqm", status: "few units left", options: [] },
  { name: "Sample Lot", project: "Sample Residences", town: "Angeles", area: "Pampanga", lotArea: "150 sqm", status: "sold out", options: [{ price: "520,000" }] },
];

// PREVIEW_LIVE_HOUSES=1 (video recording): start with the live website's public house list, and no sample customers on Home
const LIVE = process.env.PREVIEW_LIVE_HOUSES === "1" || process.argv.includes("--live-houses");
const PORT = Number((process.argv.find((a) => a.startsWith("--port=")) || "").slice(7)) || 5178;
if (LIVE) {
  const { houses } = await (await fetch("https://gahtest-chatbot.vercel.app/api/public/houses")).json();
  saved = bot.cleanSettings({ ...saved, houses: houses.map(({ slug, ...h }) => h) });
  console.log(`loaded ${saved.houses.length} live houses`);
}

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString();
  const authed = req.headers.authorization === "Bearer preview";
  const send = (status, data) => res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(data));
  if (req.url === "/" || req.url.startsWith("/?")) return res.writeHead(200, { "Content-Type": "text/html" }).end(fs.readFileSync(path.join(dir, "index.html")));
  if (req.url === "/sw.js") return res.writeHead(200, { "Content-Type": "text/javascript" }).end(fs.readFileSync(path.join(dir, "sw.js")));
  if (req.url === "/manifest.webmanifest") return res.writeHead(200, { "Content-Type": "application/manifest+json" }).end(fs.readFileSync(path.join(dir, "manifest.webmanifest")));
  // public website: /site/* files and the public house list, no password
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/site" || url.pathname.startsWith("/site/")) {
    const file = path.join(dir, url.pathname.endsWith("/") || url.pathname === "/site" ? "site/index.html" : url.pathname);
    if (!file.startsWith(path.join(dir, "site")) || !fs.existsSync(file)) return res.writeHead(404).end("Not found");
    const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png" };
    return res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" }).end(fs.readFileSync(file));
  }
  if (url.pathname === "/api/public/houses") {
    const pub = await import(pathToFileURL(path.join(dir, "lib/public.js")));
    return send(200, { houses: pub.publicHouses(saved.houses?.length ? saved : { ...saved, houses: PREVIEW_HOUSES }) });
  }
  if (url.pathname === "/api/public/chat" && req.method === "POST") {
    // preview only: a fake reply (no AI), with the same shape as the real endpoint
    const pub = await import(pathToFileURL(path.join(dir, "lib/public.js")));
    const sc = await import(pathToFileURL(path.join(dir, "lib/site-chat.js")));
    const houses = pub.publicHouses(saved.houses?.length ? saved : { ...saved, houses: PREVIEW_HOUSES });
    const b = JSON.parse(body || "{}");
    const q = (b.messages || []).at(-1)?.content || "";
    const id = String(b.visitorId || "");
    // like the real one: quiet while the owner is talking, chat saved (in memory), "visit" hands over to the Inbox
    if (Date.parse(b.ownerAt) > (Date.parse(b.markAt) || 0) && Date.now() - Date.parse(b.ownerAt) < 720 * 60_000) {
      await sc.saveTurn(id, { page: b.page, customer: q, bot: "", quiet: true });
      return send(200, { reply: "", quiet: true, photos: [], houses: [] });
    }
    const visit = /visit|bisita|tripping/i.test(q) ? { house: houses[0].slug } : null;
    const handover = !visit && /tao|agent|reserv/i.test(q);
    const reply = visit ? "[Preview] Sige po! Pumili lang po ng araw at oras sa form sa ibaba. Ang owner po ang magko-confirm."
      : handover ? "[Preview] Salamat po! Naipasa na po namin ito sa owner. Kung offline na po kayo, ite-text o tatawagan po namin kayo."
      : /pic|photo|litrato/i.test(q) ? `Eto po ang photos ng ${houses[0].name}:` : `[Preview, not a real answer] Eto po ang ilan: ${houses.slice(0, 2).map((h) => h.name).join(" at ")}. Alin po ang gusto ninyong makita?`;
    await new Promise((r) => setTimeout(r, 700));
    await sc.saveTurn(id, { page: b.page, customer: q, bot: reply, handover });
    if (handover) {
      await bot.saveLead(`web-${id}`, { name: "Preview Visitor", mobile: "0917 555 0000", house: houses[0].name, source: "website" });
      const v = await import(pathToFileURL(path.join(dir, "lib/visits.js")));
      await v.createRequest({ type: v.handoverType(b.messages || []), source: "chat", visitorId: id, name: "Preview Visitor", mobile: "0917 555 0000", house: houses[0].name, lastMessages: b.messages || [] });
    }
    return send(200, { reply, handover, visit, photos: /pic|photo/i.test(q) ? houses[0].photos : [], houses: /pic|photo/i.test(q) || visit ? [] : sc.housesIn(reply, houses) });
  }
  if (url.pathname === "/api/public/visit") {
    const sc = await import(pathToFileURL(path.join(dir, "lib/site-chat.js")));
    if (req.method === "GET") return send(200, await sc.visitDays());
    const pub = await import(pathToFileURL(path.join(dir, "lib/public.js")));
    const { status, json } = await sc.bookVisit(JSON.parse(body || "{}"), "preview", { houses: pub.publicHouses(saved.houses?.length ? saved : { ...saved, houses: PREVIEW_HOUSES }) });
    return send(status, json);
  }
  if (url.pathname === "/api/public/chat" && req.method === "GET") {
    const sc = await import(pathToFileURL(path.join(dir, "lib/site-chat.js")));
    return send(200, (await sc.ownerNews(url.searchParams.get("v"), url.searchParams.get("after") || "")) || {});
  }
  // Bot Studio Inbox: the real handlers, chats kept in memory
  if (url.pathname === "/api/leads" && ["inbox", "chat", "requests", "request", "visits", "push"].some((k) => url.searchParams.has(k))) {
    const h = await import(pathToFileURL(path.join(dir, "api/leads.js")));
    const r = await h[req.method](new Request("http://x" + req.url, { method: req.method, headers: { authorization: req.headers.authorization || "" }, body: req.method === "POST" || req.method === "PUT" ? body : undefined }));
    return res.writeHead(r.status, { "Content-Type": "application/json" }).end(await r.text());
  }
  if (!authed) return res.writeHead(401).end("Unauthorized");
  if (req.url === "/api/settings" && req.method === "GET") return send(200, saved);
  if (req.url === "/api/settings" && req.method === "PUT") {
    try { saved = bot.cleanSettings(JSON.parse(body)); return send(200, saved); } catch (e) { return res.writeHead(400).end(e.message); }
  }
  if (req.url === "/api/status") return send(200, { aiKey: true, facebook: true, storage: true, facebookPublic: false, groqModels: [] });
  if (req.url === "/api/chat") {
    const { settings, messages } = JSON.parse(body);
    const s = { ...bot.DEFAULT_SETTINGS, ...settings };
    const houses = (s.houses || []).map((h) => bot.houseText(h, s.pricing)).join("\n") || "(no houses yet)";
    return send(200, { reply: `[Preview only, not a real answer]\nYou asked: ${messages?.at(-1)?.content ?? ""}\n\nThe bot would know these houses:\n${houses.slice(0, 800)}\n\nInformation items: ${(s.sources || []).map((x) => x.title).join(", ") || "none"}` });
  }
  // sample data for the Home screen
  if (LIVE && (req.url === "/api/leads" || req.url === "/api/unanswered") && req.method === "GET") return send(200, []);
  if (req.url === "/api/leads" && req.method === "GET") return send(200, [{ id: "leads/a", userId: "u1", name: "Ana Cruz", mobile: "0917 000 1111", house: "Marigold", visitDate: "Saturday", summary: "Wants to visit Marigold.", at: new Date().toISOString(), paused: demoPaused }]);
  if (req.url.startsWith("/api/pause")) { demoPaused = req.url.includes("on=1"); return send(200, { ok: true }); }
  if (req.url === "/api/unanswered" && req.method === "GET") return send(200, [{ id: "unsure/q", question: "magkano HOA fee?", at: new Date().toISOString() }]);
  if (req.url.startsWith("/api/unanswered")) return send(200, { ok: true });
  if (req.url === "/api/tidy") return send(200, { text: "Lot area 100 sqm.\nPrice from 1.2M" });
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
