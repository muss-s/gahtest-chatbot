import { isAdmin } from "../lib/bot.js";

const { PAGE_ACCESS_TOKEN, GRAPH_VERSION = "v23.0" } = process.env;

// How many customers chatted with the Page today (Philippine time). Read from Facebook, so nothing of our own is stored.
// Only the 100 most recent chats are looked at, so a very busy day shows 100 at most. null when Facebook can't be asked.
export async function GET(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  const day = (d) => new Date(new Date(d).getTime() + 8 * 36e5).toISOString().slice(0, 10);
  const today = day(Date.now());
  let chats = null;
  try {
    if (PAGE_ACCESS_TOKEN) {
      const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/conversations?platform=messenger&fields=updated_time&limit=100&access_token=${PAGE_ACCESS_TOKEN}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) chats = ((await res.json()).data ?? []).filter((c) => day(c.updated_time) === today).length;
    }
  } catch {
    // Facebook didn't answer: Home just leaves the line out
  }
  return Response.json({ chats });
}
