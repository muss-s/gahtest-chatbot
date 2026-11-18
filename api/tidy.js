import { isAdmin, tidyText } from "../lib/bot.js";

// Pasted text in, short plain facts out. The owner checks them before saving.
export async function POST(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  const { text } = await request.json().catch(() => ({}));
  if (!String(text ?? "").trim()) return new Response("Paste some text first.", { status: 400 });
  try {
    return Response.json({ text: await tidyText(text) });
  } catch (err) {
    return new Response("The helper is busy right now. Try again in a minute.", { status: 503 });
  }
}
