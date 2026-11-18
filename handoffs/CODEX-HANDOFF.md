# Handoff for Codex: Grab A House chatbot + Bot Studio

Written 2026-11-13. Read this, then `handoffs/LIVE-STATE.md` (newest facts), `CLAUDE.md` (project rules, deploy steps) and, only if needed, root `HANDOFF.md` (background; do not edit it unless asked).

## What this is
A school project for the user (IT student): a Facebook Messenger chatbot for Grab A House (Philippine real estate) and "Bot Studio", the admin page (`index.html`, single file, served at `/`) that a non-technical company owner will maintain alone on phone and PC. Prof demo comes first; going public is parked. No build step; only dependency `@vercel/blob`.
- `api/webhook.js` (Messenger), `api/chat.js` (Studio test chat), `api/leads.js`, `api/pause.js`, `api/unanswered.js`, `api/tidy.js`, `api/photo.js`, `api/settings.js`, `api/status.js`; shared logic `lib/bot.js` (`buildPrompt`, `askLLM`, `PROVIDERS`, `botPaused`, ...).
- Check: `node test.mjs` (must print `all checks passed`). Run after every change to `lib/` or `api/`.
- Preview: `preview.mjs` on port 5178 (password `preview`), mocks the API.

## Rules from the user (follow exactly)
1. **Never deploy or save live settings unless the user says so for that change.** Build, check locally, then ask. Each "yes" covers only that change.
2. Explain changes in plain words (what changed, where in Bot Studio). The user loses track.
3. Don't edit root `HANDOFF.md` unless asked. Update `handoffs/LIVE-STATE.md` after any task that changed something.
4. Bot Studio users are non-technical: plain words, no jargon; developer details go under "For your developer".
5. Never invent prices or projects. The fictional test houses are NOT marked [TEST] (user's choice). Never type passwords or API keys; the user does that (sign in to the Studio, set Vercel env vars).
6. Fake data only in tests. Don't message the real Facebook Page.

## Deploy
Vercel project `gahtest-chatbot` (id `prj_KULrS53v2oI0t2qzJy6U1rlyho5g`), URL https://gahtest-chatbot.vercel.app. From the project folder: `npx --yes vercel deploy --prod --yes` (PowerShell: `npx.cmd`). `.vercelignore` allowlists only `api/`, `lib/`, `index.html`, `package.json`. Env var changes need a redeploy. Last deploy: `gahtest-chatbot-o5kpar5nx-keni4` (PC sidebar layout). Rollback: redeploy an older deployment in Vercel.

## State right now
- **Code deployed:** everything built so far, including the dark redesign, the on/off switch, the PC sidebar (>= 900px; phones keep a single column).
- **Live settings (Vercel Blob `settings/`, edited through Studio):** groupmate's safety rules; "How to handle inquiries" with a new rules block (LANGUAGE, RENT-TO-OWN, SITE VISITS, DISCOUNTS, SOLD OUT, LISTS, AREAS, FINANCING, REQUIREMENTS) added today; first line on "How rent-to-own works"; 17 houses (Vera, real "End Unit Angeles", 15 fictional test houses, test "End Unit Mabalacat"). Backups of old text: `handoffs/notes/2026-11-13-settings-before-groupmate-rules.md` and `2026-11-13-settings-before-fixes.md`.
- **LLM chain:** Groq `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, then Gemini (`LLM_*`), then optional `LLM2_*` (Gemini, `gemini-3.5-flash-lite`, name not verified in Google AI Studio). Free Groq limit ~8,000 tokens/min per model; one message ~3,000 tokens. The user said they would switch the `GROQ_API_KEY` in Vercel (needs a redeploy); unknown if done.
- **Env:** `GROQ_API_KEY`, `LLM_*`, `LLM2_*`, `ADMIN_PASSWORD`, Facebook tokens. Meta app is in Development mode: only people with a role on it get answers.

## Test results (the bot is NOT ready to go live)
- Guide: Downloads `bot-testing-guide.md` (sections A-F, 40 tests), `test_listings.md`, `grab-a-house-bot-prompts.md`, `bot-fixes-2026-11-13.md`.
- Run 1: Pass 20 / Partial 12 / Fail 8 (`handoffs/notes/bot-test-results-2026-11-13.md`). After applying fixes, rerun of 19: Pass 5 / Partial 10 / Fail 4 (`Downloads/bot-test-results-2026-11-13-rerun.md`). Safety (E) passed 8/8.
- **How tests were run:** from the signed-in Studio tab, `fetch("/api/chat")` with `settings: state` and a message history, fresh history per test (same endpoint as the Test page).

## Open items (suggested order)
1. **B5 bug:** "budget ko 20000000" got the reply "Polite clarification needed." (an instruction leaked as a reply). Look at the typo-guard hint in `askLLM` (`lib/bot.js`, amount >= 10M).
2. **Site visits still offered** (C2, C3, F2) despite the rule: add a code-side check (strip or re-ask) or tighten `buildPrompt`.
3. **Requirements item:** add a "Requirements" info item with the company's real list (user must get it). F5 still makes up or gives general Pag-IBIG info.
4. **Lists miss houses** (A6, A7, A9: misses the 820k Porac, 520k lot, Castillejos); "cheapest" ignores lots; sometimes English to Taglish (A3); garbled Taglish (B3, C5): mostly small-model quality. Consider a stronger key or model.
5. F4 test is invalid since the sold-out leftover was deleted: mark a real house sold out to retest.
6. Rerun the failed tests after each change. Sections G-L from the runner file do not exist in the guide.
7. Before real customers: delete the 15 fictional houses (only Vera and End Unit Angeles are real), set `quietMinutes` from 5 to 720 (12 h), fill in Vera's price/project/town, add the prof as a Tester on the Meta app, verify `LLM2_MODEL`.
8. Offered, not started: a one-page prof demo script.
9. Parked: Meta App Review for public use on facebook.com/grabahouseph; turn off Business Suite automated replies before going live.

## Gotchas
- Studio is one big `index.html` (~90 KB): search by CSS/JS names (`houseCard`, `renderHouses`, `photoPicker`, `save`, `state`, `api`, `password`). Desktop CSS is the `@media (min-width: 900px)` block near the end of `<style>`; later rules with equal specificity win (use a `main` prefix).
- Knowledge base cap 30,000 chars (`MAX_KB_CHARS` in `lib/bot.js`, `MAX_CHARS` in `index.html`); currently ~21.9k.
- Hidden tokens `[AGENT]`, `[PHOTOS: name]`, `[UNSURE]` are stripped by the webhook and the test chat.
- Models fill gaps: missing facts are written out in `houseText` ("NOT LISTED") on purpose.
- Vercel MCP calls fail with `teamId`/`slug`; use the CLI. Runtime logs are not readable through MCP.
- Saving settings from the Studio page: `await save()` in the page console works; `/api/settings` (GET, `Authorization: Bearer <password>`) shows the live copy.
- A new deployment URL serves a "building" HTML page until ready.

## Transcript (for old topics)
`C:\Users\merci\.claude\projects\C--Users-merci-OneDrive-Documents-Projects-chatbot\92c5a4d9-8f39-4e1d-a753-1bd392a95a2f.jsonl` (this whole session; grep it by topic, e.g. "groupmate", "LLM2", "sidebar").

## Start message for Codex
Read `handoffs/CODEX-HANDOFF.md`, `handoffs/LIVE-STATE.md` and `CLAUDE.md`, then continue with the open items. Do not deploy or save live settings without asking the user first.
