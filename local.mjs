// Local test: node --env-file=.env local.mjs "your message"
// Starts the webhook, sends it a signed fake Messenger message, prints the bot's reply, exits.
import crypto from "node:crypto";
import http from "node:http";

process.env.DRY_RUN = "1";
const { GET, POST } = await import("./api/webhook.js");

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(`http://localhost:3000${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
  });
  const out = await (req.method === "GET" ? GET : POST)(request);
  res.writeHead(out.status).end(await out.text());
}).listen(3000);

const body = JSON.stringify({
  object: "page",
  entry: [{ messaging: [{ sender: { id: "test-user" }, message: { text: process.argv[2] ?? "Hi, how much is a house in Pampanga?" } }] }],
});
const signature = "sha256=" + crypto.createHmac("sha256", process.env.APP_SECRET).update(body).digest("hex");
const res = await fetch("http://localhost:3000/api/webhook", { method: "POST", body, headers: { "x-hub-signature-256": signature } });
console.log("webhook status:", res.status);
server.close();
