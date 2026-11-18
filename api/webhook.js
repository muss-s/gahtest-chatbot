import crypto from "node:crypto";
import { askLLM, botPaused, DEFAULT_SETTINGS, extractLead, isPaused, loadSettings, markQuiet, quietState, saveLead, saveUnsure, takePhotos, takeUnsure } from "../lib/bot.js";

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

const LABEL = "Needs agent";
const HANDOVER = "[AGENT]";
const BOT_TAG = "sent-by-bot"; // echoed back by Facebook as message.metadata
let labelId; // looked up once; the label only needs to be created the first time

async function handleEvent(event, settings) {
  if (event.message?.is_echo) {
    // The bot tags its own replies (BOT_TAG); anything else came from staff in the inbox (photos too), so the bot steps back.
    // Not app_id: messages sent from Meta Business Suite carry Facebook's own app_id.
    const customerId = event.recipient?.id;
    if (event.message.metadata !== BOT_TAG && customerId) {
      await handOver(customerId, "staff");
    }
    return;
  }
  const text = event.message?.text;
  if (!text) return; // skip stickers and images

  const senderId = event.sender.id;
  // The owner switched the bot off, or it is resting during the hours she set for the team: say nothing, the team answers.
  if (botPaused(settings)) return;
  // "Reply myself": the owner paused the bot for this customer until she turns it back on. If the check fails, still answer.
  try {
    if (await isPaused(senderId)) return;
  } catch (err) {
    console.warn("Couldn't check whether this chat is paused, replying anyway:", err.message);
  }
  // Staff replied or the bot handed over within the quiet time set in Bot Studio, so stay quiet. If the check fails, still answer.
  try {
    const state = await quietState(senderId, new Date(), settings.quietMinutes);
    // Handed over but no agent has replied yet: by default keep helping until one does (Bot Studio "while waiting").
    const keepHelping = state === "bot" && settings.whileWaiting !== "wait";
    if (state === "bot" && !keepHelping) {
      // tell the customer once that they haven't been forgotten
      await sendToMessenger(senderId, { messaging_type: "RESPONSE", message: { text: settings.waitingNote || DEFAULT_SETTINGS.waitingNote, metadata: BOT_TAG } });
      await markQuiet(senderId, "reminded");
    }
    if (state && !keepHelping) return;
  } catch (err) {
    console.warn("Couldn't check whether staff are handling this chat, replying anyway:", err.message);
  }
  try {
    await sendToMessenger(senderId, { sender_action: "typing_on" });
    const history = await recentMessages(senderId, event.recipient?.id, event.message.mid, text);
    let reply = await askLLM(settings, [...history, { role: "user", content: text }]);
    // [PHOTOS: house name]: send that house's pictures after the text
    const taken = takePhotos(reply, settings.houses, { asked: text, context: history.slice(-4).map((m) => m.content).join("\n") });
    reply = taken.reply;
    const photos = taken.photos;
    // [UNSURE]: the bot didn't know; write the question down so the owner can add the answer in Bot Studio
    const unsure = takeUnsure(reply);
    reply = unsure.reply;
    if (unsure.unsure) await saveUnsure(text).catch((err) => console.warn("Couldn't write down the question:", err.message));
    const handover = reply.includes(HANDOVER);
    if (handover) reply = reply.replaceAll(HANDOVER, "\0").replace(/\s*\0\s*/g, " ").trim();
    // The bot goes quiet after a handover, so its last message must not leave the customer waiting on a question.
    if (handover && reply.endsWith("?")) reply = reply.replace(/[^.!?]*\?\s*$/, "").trim(); // drop a last question nobody will answer
    if (handover && !/agent/i.test(reply)) reply = `${reply} ${settings.handoverNote || DEFAULT_SETTINGS.handoverNote}`.trim();
    // a short pause so the reply doesn't land instantly, like a person typing (the typing dots are already showing)
    if (!process.env.DRY_RUN && !process.env.NO_TYPING_DELAY) await new Promise((r) => setTimeout(r, Math.min(2000, 400 + reply.length * 15)));
    await sendToMessenger(senderId, { messaging_type: "RESPONSE", message: { text: reply.slice(0, 2000), metadata: BOT_TAG } });
    // After sending: the customer already has their answer even if this fails.
    for (const url of photos) {
      await sendToMessenger(senderId, { messaging_type: "RESPONSE", message: { attachment: { type: "image", payload: { url, is_reusable: true } }, metadata: BOT_TAG } }).catch((err) => console.warn("Couldn't send a photo:", err.message));
    }
    if (handover) {
      await handOver(senderId, "bot");
      await recordLead(senderId, [...history, { role: "user", content: text }, { role: "assistant", content: reply }]);
    }
  } catch (err) {
    console.error("Failed to reply to", senderId, err);
    await sendToMessenger(senderId, { messaging_type: "RESPONSE", message: { text: settings.fallback, metadata: BOT_TAG } }).catch(() => {});
  }
}

// Writes down who asked for a call or visit so the owner sees it in Bot Studio. Never stops the chat if it fails.
async function recordLead(userId, chat) {
  try {
    await saveLead(userId, await extractLead(chat));
  } catch (err) {
    console.warn("Couldn't write down the lead:", err.message);
  }
}

// Facebook sends one message at a time, so read the last few from the Page's inbox to remember what was said.
// ponytail: Facebook already stores the chat, so nothing to keep ourselves. 6 short messages stay within Groq's free limit.
async function recentMessages(userId, pageId, currentId, currentText) {
  if (process.env.DRY_RUN) return [];
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/conversations?platform=messenger&user_id=${userId}` +
        `&fields=messages.limit(7){message,from}&access_token=${PAGE_ACCESS_TOKEN}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    let messages = ((await res.json()).data?.[0]?.messages?.data ?? []).filter((m) => m.message && m.id !== currentId);
    // newest first; the message being answered may already be in the inbox
    if (messages[0]?.from?.id !== pageId && messages[0]?.message === currentText) messages = messages.slice(1);
    return messages
      .slice(0, 6)
      .reverse()
      .map((m) => ({ role: m.from?.id === pageId ? "assistant" : "user", content: m.message.slice(0, 500) }));
  } catch (err) {
    console.warn("Couldn't read chat history, answering without it:", err.message);
    return [];
  }
}

// The "Needs agent" label lets staff filter the Meta Business Suite inbox for chats waiting on them.
async function graph(path, init = {}) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${sep}access_token=${PAGE_ACCESS_TOKEN}`, {
    ...init,
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

const post = (path, body) => graph(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// The note keeps the bot quiet; the label shows staff which chats are waiting. Either can fail without stopping the other.
async function handOver(userId, by) {
  await markQuiet(userId, by).catch((err) => console.warn("Couldn't note that staff are handling this chat:", err.message));
  await addLabel(userId).catch((err) => console.warn("Couldn't add the Needs agent label:", err.message));
}

async function addLabel(userId) {
  if (process.env.DRY_RUN) return console.log("[dry run] label", userId, "->", LABEL);
  if (!labelId) {
    const { data = [] } = await graph("me/custom_labels?fields=page_label_name&limit=100");
    labelId = data.find((l) => l.page_label_name === LABEL)?.id ?? (await post("me/custom_labels", { page_label_name: LABEL })).id;
  }
  await post(`${labelId}/label`, { user: userId });
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
