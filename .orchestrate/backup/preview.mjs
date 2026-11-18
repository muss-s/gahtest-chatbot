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

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString();
  const authed = req.headers.authorization === "Bearer preview";
  const send = (status, data) => res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(data));
  if (req.url === "/" ) return res.writeHead(200, { "Content-Type": "text/html" }).end(fs.readFileSync(path.join(dir, "index.html")));
  if (!authed) return res.writeHead(401).end("Unauthorized");
  if (req.url === "/api/settings" && req.method === "GET") return send(200, saved);
  if (req.url === "/api/settings" && req.method === "PUT") {
    try { saved = bot.cleanSettings(JSON.parse(body)); return send(200, saved); } catch (e) { return res.writeHead(400).end(e.message); }
  }
  if (req.url === "/api/status") return send(200, { aiKey: true, facebook: true, storage: true, groqModels: [] });
  if (req.url === "/api/chat") {
    const { settings } = JSON.parse(body);
    return send(200, { reply: "[preview] prompt has " + (settings.houses?.length ?? 0) + " houses:\n" + bot.buildPrompt({ ...bot.DEFAULT_SETTINGS, ...settings }).split("Houses for sale")[1]?.slice(0, 400) });
  }
  res.writeHead(404).end();
}).listen(5178, () => console.log("http://localhost:5178"));
