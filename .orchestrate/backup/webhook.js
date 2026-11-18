import crypto from "node:crypto";
import { askLLM, loadSettings } from "../lib/bot.js";

const { VERIFY_TOKEN, PAGE_ACCESS_TOKEN, APP_SECRET, GRAPH_VERSION = "v23.0" } = process.env;

// Facebook calls this once, when you register the webhook URL.
export function GET(request) {
  const params = new URL(request.url).searchParams;
  if (params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === VERIFY_TOKEN) {
    return new Response(params.get("hub.challenge"), { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Facebook calls this for every incoming message.
export async function POST(request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Bad signature", { status: 401 });
  }

  const body = JSON.parse(raw);
  if (body.object !== "page") return new Response("Ignored", { status: 404 });

  const events = body.entry.flatMap((entry) => entry.messaging ?? []);
  if (events.length) {
    const settings = await loadSettings();
    await Promise.all(events.map((event) => handleEvent(event, settings)));
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
}

function validSignature(raw, header) {
  if (!APP_SECRET || !header) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(raw).digest("hex");
  return header.length === expected.length && crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

async function handleEvent(event, settings) {
  const text = event.message?.text;
  if (!text || event.message.is_echo) return; // skip stickers, images, and the page's own replies

  const senderId = event.sender.id;
  try {
    await sendToMessenger(senderId, { sender_action: "typing_on" });
    const history = await recentMessages(senderId, event.recipient?.id, event.message.mid, text);
    const reply = await askLLM(settings, [...history, { role: "user", content: text }]);
    await sendToMessenger(senderId, { messaging_type: "RESPONSE", message: { text: reply.slice(0, 2000) } });
  } catch (err) {
    console.error("Failed to reply to", senderId, err);
    await sendToMessenger(senderId, { messaging_type: "RESPONSE", message: { text: settings.fallback } }).catch(() => {});
  }
}

// Facebook sends one message at a time, so read the last few from the Page's inbox to remember what was said.
// ponytail: Facebook already stores the chat, so nothing to keep ourselves. 10 short messages stay within Groq's free limit.
async function recentMessages(userId, pageId, currentId, currentText) {
  if (process.env.DRY_RUN) return [];
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/conversations?platform=messenger&user_id=${userId}` +
        `&fields=messages.limit(11){message,from}&access_token=${PAGE_ACCESS_TOKEN}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    let messages = ((await res.json()).data?.[0]?.messages?.data ?? []).filter((m) => m.message && m.id !== currentId);
    // newest first; the message being answered may already be in the inbox
    if (messages[0]?.from?.id !== pageId && messages[0]?.message === currentText) messages = messages.slice(1);
    return messages
      .slice(0, 10)
      .reverse()
      .map((m) => ({ role: m.from?.id === pageId ? "assistant" : "user", content: m.message.slice(0, 500) }));
  } catch (err) {
    console.warn("Couldn't read chat history, answering without it:", err.message);
    return [];
  }
}

async function sendToMessenger(recipientId, payload) {
  if (process.env.DRY_RUN) return console.log("[dry run] reply to", recipientId, "->", payload.message?.text ?? payload.sender_action);
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, ...payload }),
    },
  );
  if (!res.ok) throw new Error(`Messenger ${res.status}: ${await res.text()}`);
}
