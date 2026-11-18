// The Bot Studio database in Oracle APEX (ORDS REST, base path gahbot).
// Set APEX_URL (https://iacademy.oracle.com/ords/gahbot/bot) and APEX_KEY in Vercel. Without them the old Blob code runs.
const { APEX_URL, APEX_KEY } = process.env;

export const useApex = () => Boolean(APEX_URL && APEX_KEY);

export async function apex(path, body) {
  const post = body !== undefined;
  const res = await fetch(`${APEX_URL.replace(/\/+$/, "")}/${path}`, {
    method: post ? "POST" : "GET",
    headers: { "x-bot-key": APEX_KEY, ...(post ? { "content-type": "application/json" } : {}) },
    body: post ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `APEX ${res.status}`);
  return json;
}

// settings and visit settings come from one call; reuse it for 10 s per server instance
let cfg = { at: 0, p: null };
export function apexConfig() {
  if (!cfg.p || Date.now() - cfg.at > 10_000) {
    const p = apex("config");
    cfg = { at: Date.now(), p };
    p.catch(() => { if (cfg.p === p) cfg.p = null; });
  }
  return cfg.p;
}
