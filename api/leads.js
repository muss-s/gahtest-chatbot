import { isAdmin, listLeads, pausedIds, removeLead } from "../lib/bot.js";
import { listChats, markChat, ownerReply, readChat } from "../lib/site-chat.js";
import { createRequest, customerMessage, decide, listRequests, loadVisitSettings, openDays, saveVisitSettings } from "../lib/visits.js";
import { deviceCount, notifyOwner, publicKey, subscribe, unsubscribe } from "../lib/push.js";
//   GET  ?push=key          the key a device needs to turn alerts on, and how many devices have them
//   POST ?push=on|off|test  { subscription, label } / { endpoint } / nothing

// People the bot passed to the team, newest first. Bot Studio shows them on the Home screen.
// Also the Bot Studio Inbox, Approvals and Calendar (kept in this function: Vercel's free plan allows 12):
//   GET  ?inbox=1          list of website chats
//   GET  ?chat=<id>        one whole chat
//   POST ?chat=<id>        { text } owner's reply, or { mark: "handled" | "closed" | "open" }
//   GET  ?requests=1       every request (site visits, reservations...), the visit settings and open days
//   POST ?request=<id>     { action: approve | suggest | decline | handled | reopen, date, slot, note }
//   POST ?request=new      the owner adds a visit by hand (approved at once)
//   PUT  ?visits=settings  visit days, times, maximum per time, blocked dates
const withMessages = (requests, settings) => requests.map((r) => ({ ...r, message: customerMessage(r, settings) }));

export async function GET(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  const q = new URL(request.url).searchParams;
  if (q.get("push") === "key") return Response.json({ publicKey: await publicKey(), devices: await deviceCount() }, { headers: { "Cache-Control": "no-store" } });
  if (q.get("requests")) {
    const [requests, settings] = await Promise.all([listRequests(), loadVisitSettings()]);
    return Response.json({ requests: withMessages(requests, settings), settings, days: openDays(settings, requests) }, { headers: { "Cache-Control": "no-store" } });
  }
  if (q.get("inbox")) return Response.json(await listChats(), { headers: { "Cache-Control": "no-store" } });
  if (q.get("chat")) {
    const chat = await readChat(q.get("chat"));
    return chat ? Response.json(chat, { headers: { "Cache-Control": "no-store" } }) : new Response("Not found", { status: 404 });
  }
  const [leads, paused] = await Promise.all([listLeads(), pausedIds().catch(() => new Set())]);
  return Response.json(leads.map((l) => ({ ...l, paused: paused.has(l.userId) })));
}

export async function POST(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  const q = new URL(request.url).searchParams;
  const id = q.get("chat");
  let body;
  try { body = await request.json(); } catch { return new Response("Bad request", { status: 400 }); }
  if (q.get("push")) {
    try {
      if (q.get("push") === "on") await subscribe(body?.subscription, body?.label);
      else if (q.get("push") === "off") await unsubscribe(String(body?.endpoint || ""));
      else if (q.get("push") === "test") return Response.json({ sent: await notifyOwner({ title: "Alerts are on", body: "This is a test. You'll get an alert like this when a customer needs you.", url: "/", tag: "test" }) });
      else return new Response("Not found", { status: 404 });
      return Response.json({ ok: true, devices: await deviceCount() });
    } catch (err) {
      return new Response(err.message, { status: 400 });
    }
  }
  if (q.get("request")) {
    try {
      const settings = await loadVisitSettings();
      if (q.get("request") === "new") {
        const r = await createRequest({ ...body, type: "visit", source: "owner" });
        return Response.json({ request: r, message: customerMessage(r, settings) });
      }
      const r = await decide(q.get("request"), body || {});
      const message = ["approve", "suggest", "decline"].includes(body?.action) ? customerMessage(r, settings) : "";
      // the customer also sees it in their website chat (and the bot stays quiet while the owner handles it)
      if (message && r.visitorId) await ownerReply(r.visitorId, message).catch((err) => console.warn("Couldn't add it to the chat:", err.message));
      return Response.json({ request: r, message });
    } catch (err) {
      return new Response(err.message, { status: 400 });
    }
  }
  try {
    if (body?.mark) await markChat(id, body.mark);
    else await ownerReply(id, body?.text);
    return Response.json({ ok: true });
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
}

export async function PUT(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  if (new URL(request.url).searchParams.get("visits") !== "settings") return new Response("Not found", { status: 404 });
  try { return Response.json(await saveVisitSettings(await request.json())); } catch { return new Response("Bad request", { status: 400 }); }
}

// "Done": removes one from the list.
export async function DELETE(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  try {
    await removeLead(new URL(request.url).searchParams.get("id"));
    return Response.json({ ok: true });
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
}
