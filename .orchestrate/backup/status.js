import { isAdmin } from "../lib/bot.js";

// Setup checklist for Bot Studio: says which settings exist, never their values.
export async function GET(request) {
  if (!isAdmin(request)) return new Response("Unauthorized", { status: 401 });
  const env = process.env;
  return Response.json({
    aiKey: Boolean(env.GROQ_API_KEY || env.LLM_API_KEY),
    facebook: Boolean(env.PAGE_ACCESS_TOKEN && env.APP_SECRET),
    storage: Boolean(env.BLOB_READ_WRITE_TOKEN),
    groqModels: env.GROQ_API_KEY ? await groqModels(env.GROQ_API_KEY) : [], // for picking GROQ_MODELS
  });
}

async function groqModels(key) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
    return (await res.json()).data.map((m) => m.id).sort();
  } catch {
    return [];
  }
}
