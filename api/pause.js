import { isAdmin, setPaused } from "../lib/bot.js";

// "Reply myself" / "Bot back on" for one customer. POST ?id=<customer>&on=1 or &on=0
export async function POST(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  const params = new URL(request.url).searchParams;
  try {
    await setPaused(params.get("id"), params.get("on") !== "0");
    return Response.json({ ok: true });
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
}
