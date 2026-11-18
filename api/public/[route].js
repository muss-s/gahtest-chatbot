import { loadSettings } from "../../lib/bot.js";
import { publicHouses } from "../../lib/public.js";
import { bookVisit, ownerNews, visitDays, websiteReply } from "../../lib/site-chat.js";

// The website's public endpoints in one function (Vercel's free plan allows 12 functions):
// GET  /api/public/houses  house list for the website (only the fields in lib/public.js), cached about 10 seconds
// POST /api/public/chat    the website chat (lib/site-chat.js); the server loads the saved settings itself
// GET  /api/public/visit   open site-visit days and times (no names, only "full" or not)
// POST /api/public/visit   the booking form: creates a pending request for the owner
// No password: nothing private is ever returned.
const route = (request) => new URL(request.url).pathname.split("/").filter(Boolean).at(-1);
const ipOf = (request) => (request.headers.get("x-forwarded-for") || "").split(",")[0].trim();

export async function GET(request) {
  if (route(request) === "visit") return Response.json(await visitDays(), { headers: { "Cache-Control": "no-store" } });
  // GET /api/public/chat?v=<visitor>&after=<time>: the owner's replies for that visitor's own chat window
  if (route(request) === "chat") {
    const q = new URL(request.url).searchParams;
    const news = await ownerNews(q.get("v"), q.get("after") || "").catch(() => null);
    return news ? Response.json(news, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "bad request" }, { status: 400 });
  }
  if (route(request) !== "houses") return new Response("Not found", { status: 404 });
  const houses = publicHouses(await loadSettings());
  // short cache so a save in Bot Studio shows on the website within seconds
  return Response.json({ houses }, { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } });
}

export async function POST(request) {
  const where = route(request);
  if (where !== "chat" && where !== "visit") return new Response("Not found", { status: 404 });
  const ip = ipOf(request);
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (where === "visit") {
    const { status, json } = await bookVisit(body, ip).catch((err) => (console.error(err), { status: 500, json: { error: "Couldn't send the request. Please call or text 0932 424 4949." } }));
    return Response.json(json, { status, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const { status, json } = await websiteReply(body, ip);
    return Response.json(json, { status, headers: { "Cache-Control": "no-store" } });
  } catch (err) { // the chat never shows an error page: it asks the customer to call
    console.error(err);
    return Response.json({ reply: "Pasensya na po, may problema sa ngayon. Tumawag o mag-text po sa 0932 424 4949 (Smart) o 0976 229 0328 (Globe).", photos: [], houses: [], error: true }, { status: 200 });
  }
}
