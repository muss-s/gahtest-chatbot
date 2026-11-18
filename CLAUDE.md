# Facebook Page chatbot + Bot Studio

Messenger webhook (`api/webhook.js`) answers with an LLM using settings edited in Bot Studio (`index.html`, served at `/`). Shared logic: `lib/bot.js`. No build step; dependencies `@vercel/blob` and `web-push` (owner alerts, `lib/push.js`).

- Read handoffs/LIVE-STATE.md first. Update it after any task that changed something, before saying "done".
- Background, rules and the topic index: HANDOFF.md (project root).

## Check
- `node test.mjs`: the self-check (mocks Facebook, LLMs, web pages). Run after every change to `lib/` or `api/`.

## Deploy (Vercel project `gahtest-chatbot`, id `prj_KULrS53v2oI0t2qzJy6U1rlyho5g`, URL https://gahtest-chatbot.vercel.app)
- Vercel MCP calls work only **without** `teamId`/`slug` (passing team `keni4` gives 403). Runtime logs are not readable through MCP.
- **Deploy with the CLI** (signed in, folder linked via `.vercel/`): `npx --yes vercel deploy --prod --yes` from Bash. `.vercelignore` allowlists only `api/`, `lib/`, `index.html`, `site/`, `package.json`, `manifest.webmanifest`, `sw.js`. On PowerShell use `npx.cmd`. Then check `list_deployment_files` uids against local sha1s.
- Fallback only: MCP `create_deployment` with `target: "production"`, `projectSettings: { framework: null }`, inlining changed files and referencing the rest by `{ file, sha, size }`. Costly for `index.html` (~90 KB).
- Env var changes need a redeploy: `create_deployment` with `deploymentId` of the latest deployment.
- A new deployment URL serves a "Deployment is building" HTML page (200) until ready. Poll an `/api/*` endpoint until it returns JSON.

## Facts
- LLM fallback chain (`PROVIDERS` in `lib/bot.js`): Groq `GROQ_MODELS`, then Gemini (`LLM_API_KEY`, `LLM_MODEL`). Models get retired. `GET /api/status` (admin) lists the Groq models the key can use.
- Settings live in Vercel Blob under `settings/` (new file per save, newest wins, 3 kept). Legacy `settings.json` is only a fallback.
- Knowledge base cap: 30,000 chars (`MAX_KB_CHARS` and `MAX_CHARS` in `index.html`) so one message fits Groq's free per-minute limit.
- Bot Studio users are non-technical: plain words, no jargon. Developer details go under "For your developer".
- Test Page: GAHtest. Client Page: facebook.com/grabahouseph (Grab A House, real estate). Never invent prices or projects in the knowledge base.

## Open
- Facebook connected to GAHtest (2026-10-16): Meta app in Development mode, so the bot only answers people with a role on the app. Public use (Grab A House) needs App Review for `pages_messaging` (privacy policy URL, screencast, likely business verification).
