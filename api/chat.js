import { DEFAULT_SETTINGS, askLLM, isAdmin, takePhotos, takeUnsure } from "../lib/bot.js";

// Test chat for the admin page. Uses the settings in the form, saved or not.
export async function POST(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  const { settings, messages } = await request.json();
  try {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    const recent = messages.slice(-20);
    // hide the hidden tags (as the real Messenger bot does), so the test chat shows what customers would see
    // same instructions as the website chat, the customers' channel
    const raw = takeUnsure(await askLLM(merged, recent, { channel: "website" })).reply.replace(/\s*\[AGENT\]/gi, "");
    const last = [...recent].reverse().find((m) => m.role === "user")?.content ?? "";
    // the pictures the real bot would send after this reply, so photos can be tested without Messenger
    const { reply, photos } = takePhotos(raw, merged.houses, { asked: last, context: recent.slice(-5, -1).map((m) => m.content).join("\n") });
    return Response.json({ reply, photos });
  } catch (err) {
    console.error(err);
    return Response.json({ error: String(err.message) }, { status: 502 });
  }
}
