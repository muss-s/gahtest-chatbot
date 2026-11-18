import { isAdmin, loadSettings, saveSettings } from "../lib/bot.js";

export async function GET(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  return Response.json(await loadSettings({ fresh: true }));
}

export async function PUT(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  try {
    return Response.json(await saveSettings(await request.json()));
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
}
