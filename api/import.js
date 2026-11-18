import { isAdmin } from "../lib/bot.js";

// Fetches a web page and returns its readable text, for adding to the knowledge base.
export async function POST(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  const { url } = await request.json();
  if (!/^https?:\/\//i.test(url ?? "")) return new Response("Enter a full URL starting with http:// or https://", { status: 400 });

  let html;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (BotStudio importer)" }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return new Response(`The site answered ${res.status}`, { status: 400 });
    html = (await res.text()).slice(0, 3_000_000);
  } catch (err) {
    return new Response(`Couldn't fetch that page: ${err.message}`, { status: 400 });
  }

  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? url).trim();
  const content = decode(
    html
      .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim()
    .slice(0, 100_000);

  if (content.length < 50) return new Response("No readable text found on that page (it may need a login or JavaScript).", { status: 400 });
  return Response.json({ title, content });
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n))
    .replace(/&amp;/g, "&");
}
