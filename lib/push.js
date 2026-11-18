// Phone and computer alerts for the owner (Web Push), for urgent things only: a new request, or a customer
// writing while the owner is handling their chat. Free: no outside account. The keys that sign the alerts come from
// VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY if the developer set them, otherwise the server makes a pair once and keeps it.
import { list, put, del } from "@vercel/blob";
import webpush from "web-push";

const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const local = { keys: null, subs: new Map(), sent: [] }; // self-check and local preview
const SUBJECT = "https://gahtest-chatbot.vercel.app";

let keysPromise = null;
async function keys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  if (!hasBlob()) return (local.keys ||= webpush.generateVAPIDKeys());
  keysPromise ||= (async () => {
    const read = async () => {
      const { blobs } = await list({ prefix: "push/keys" });
      const oldest = blobs.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))[0]; // two made at once: everyone uses the first
      return oldest ? (await fetch(oldest.url, { cache: "no-store" })).json() : null;
    };
    const found = await read();
    if (found?.publicKey) return found;
    // random suffix: the address can't be guessed
    await put("push/keys.json", JSON.stringify(webpush.generateVAPIDKeys()), { access: "public", addRandomSuffix: true, contentType: "application/json" });
    return read();
  })().catch((err) => { keysPromise = null; throw err; });
  return keysPromise;
}
export const publicKey = async () => (await keys()).publicKey;

// one file per device; the endpoint is the device's address at its push service
const cleanSub = (s) => (s && typeof s.endpoint === "string" && /^https:\/\//.test(s.endpoint) && s.keys?.p256dh && s.keys?.auth
  ? { endpoint: s.endpoint.slice(0, 1000), keys: { p256dh: String(s.keys.p256dh).slice(0, 200), auth: String(s.keys.auth).slice(0, 100) } } : null);
async function subFiles() {
  if (!hasBlob()) return [...local.subs.values()].map((sub) => ({ sub }));
  const { blobs } = await list({ prefix: "push/sub" });
  return (await Promise.all(blobs.map(async (b) => { try { return { url: b.url, sub: await (await fetch(b.url, { cache: "no-store" })).json() }; } catch { return null; } }))).filter(Boolean);
}
export async function subscribe(raw, label = "") {
  const sub = cleanSub(raw);
  if (!sub) throw new Error("Not a push subscription");
  await unsubscribe(sub.endpoint); // the same device again: keep one copy
  const row = { ...sub, label: String(label).slice(0, 80), at: new Date().toISOString() };
  if (!hasBlob()) return void local.subs.set(sub.endpoint, row);
  await put("push/sub.json", JSON.stringify(row), { access: "public", addRandomSuffix: true, contentType: "application/json" });
}
export async function unsubscribe(endpoint) {
  if (!hasBlob()) return void local.subs.delete(endpoint);
  const gone = (await subFiles()).filter((f) => f.sub.endpoint === endpoint);
  if (gone.length) await del(gone.map((f) => f.url));
}
export const deviceCount = async () => (await subFiles()).length;

// Sends to every device that turned alerts on. Never throws (an alert must not break a customer's reply);
// waits at most 4 seconds. Devices that were uninstalled or turned alerts off are removed.
export async function notifyOwner({ title, body = "", url = "/", tag = "" }) {
  try {
    const files = await subFiles();
    if (!files.length) return 0;
    const k = await keys();
    const payload = JSON.stringify({ title: String(title).slice(0, 80), body: String(body).slice(0, 180), url, tag });
    if (!hasBlob()) { local.sent.push(JSON.parse(payload)); return files.length; }
    const results = await Promise.race([
      Promise.allSettled(files.map((f) => webpush.sendNotification(f.sub, payload, { vapidDetails: { subject: SUBJECT, publicKey: k.publicKey, privateKey: k.privateKey }, TTL: 24 * 3600, urgency: "high" }))),
      new Promise((ok) => setTimeout(() => ok([]), 4000)),
    ]);
    const dead = results.map((r, i) => (r.status === "rejected" && [404, 410].includes(r.reason?.statusCode) ? files[i].url : null)).filter(Boolean);
    if (dead.length) await del(dead).catch(() => {});
    return results.filter((r) => r.status === "fulfilled").length;
  } catch (err) {
    console.warn("Couldn't send the alert:", err.message);
    return 0;
  }
}
export const localSent = () => local.sent;
