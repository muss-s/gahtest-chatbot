import { put } from "@vercel/blob";
import { isAdmin } from "../lib/bot.js";

// Bot Studio shrinks each photo on the phone first (about 1200 px, JPEG), so this only stores it.
const MAX_BYTES = 1_500_000;

export async function POST(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return new Response("Photo storage is not set up", { status: 503 });
  const type = request.headers.get("content-type") ?? "";
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return new Response("Use a JPG, PNG or WebP picture", { status: 400 });
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > MAX_BYTES) return new Response("That picture is too big", { status: 413 });
  const ext = type.split("/")[1].replace("jpeg", "jpg");
  const saved = await put(`photos/house.${ext}`, bytes, { access: "public", addRandomSuffix: true, contentType: type });
  return Response.json({ url: saved.url });
}
