import { isAdmin, listUnsure, removeUnsure } from "../lib/bot.js";

// Questions the bot said it wasn't sure about, newest first. Bot Studio shows them so the owner can add the answer.
export async function GET(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  return Response.json(await listUnsure());
}

export async function DELETE(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  try {
    await removeUnsure(new URL(request.url).searchParams.get("id"));
    return Response.json({ ok: true });
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
}
