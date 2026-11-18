# Handoff: Grab A House chatbot

Read with [handoffs/LIVE-STATE.md](handoffs/LIVE-STATE.md) (what's true right now), [CLAUDE.md](CLAUDE.md) (deploy steps, facts) and [README.md](README.md) (setup).

## 1. Role
Build and run a Facebook Messenger chatbot for **Grab A House** (Philippine real estate: rent-to-own house and lot in Pampanga, Tarlac, Bataan, Subic), plus **Bot Studio**, the admin page. The user is an IT student building it with groupmates for a school project. After the project, the company **owner (no IT background)** maintains Bot Studio alone, on phone and computer. A groupmate is moving the bot to Oracle APEX ([APEX-MIGRATION.md](APEX-MIGRATION.md)).

## 2. How to work with the user
- Explain every change in plain words: what the bot now does differently, and where to see or change it in Bot Studio. Not code. (The user said they lost track and couldn't edit the knowledge base without asking Claude.)
- **When the user only asks a question, answer it; don't build.** ("stop … i just asked" after Claude started building tap-question buttons; all of it was undone.)
- Short answers, result first. Taglish is fine in bot wording; Bot Studio uses Simple English.
- Don't edit HANDOFF.md unless asked (this rewrite was asked for).
- Judge Bot Studio screens by "could the owner do this alone on a phone?"
- Orchestrate (manager) mode was used: bigger work goes to agents with an explicit `model`, and reports go to `.orchestrate/`.

## 3. Rules and access
- **Secrets:** Claude never enters keys, tokens or passwords. The user pastes them into Vercel. Claude doesn't accept terms on the user's behalf.
- **Never invent prices or projects** in the knowledge base or test data.
- Real Page `facebook.com/grabahouseph` (Page id 113356243749984): read only. Test Page: **GAHtest**.
- **Deploy:** Vercel CLI from Bash, `npx --yes vercel deploy --prod --yes` (signed in, folder linked via `.vercel/`; `.vercelignore` allowlists `api/`, `lib/`, `index.html`, `package.json`). Run `node test.mjs` separately first, never piped into the deploy. Then compare live files with local sha1s.
- **Logs:** `npx vercel logs --since 55m --json` (Hobby keeps about 1 hour). The Vercel MCP runtime-logs tool returns 403.
- **Local preview:** `.claude/launch.json` → "bot-studio-preview" = `node preview.mjs .`, port 5178, admin password `preview`.
- Lean mode: base, profile code. Live state: `handoffs/LIVE-STATE.md`.

## 4. Decisions
- **AI chain** (`PROVIDERS` in `lib/bot.js`): Groq `openai/gpt-oss-120b` → `qwen/qwen3.8-27b` → `openai/gpt-oss-20b` → Gemini `gemini-3.8-flash`. No retry. The free tier allows about 7–8k tokens per minute per model, and one message is about 3k tokens.
- **Memory:** the last 20 messages are read from the Page inbox (Graph conversations). No storage of our own.
- **Staff detection:** bot messages carry `metadata: "sent-by-bot"`. Any other echo means staff replied, so the bot goes quiet. (Not app_id: Business Suite replies carry Facebook's app_id.)
- **Quiet time:** Blob note `handover/{psid}.txt` = `staff` | `bot` | `reminded`, valid for `quietMinutes` (default 720). Labels can be added but not read back (GET custom_labels is unsupported).
- **Handover:** the AI ends its reply with `[AGENT]`. The webhook removes it, cuts a last question, adds `handoverNote`, marks quiet, and adds the "Needs agent" label. Triggers are set in Bot Studio (`handoverWhen`).
- **Flow switches in Bot Studio:** `leadQuestions` (ordered), `handoverWhen`, `whileWaiting` (help/wait), `computation` (ask which financing first / send all), `pricing` (share/agent).
- **Houses:** `options[]` per financing (Pag-IBIG / Bank / In-house, max 3). Prices older than 30 days are shared with an "as of" warning.
- **Replies:** 1–2 sentences, no markdown. `oneTurn` cuts invented customer turns.
- **Off-topic guard:** `TOPIC_RULE` in the prompt, plus `looksLikeCode` → `OFF_TOPIC_REPLY`.
- Rejected: tap-question buttons (ice breakers; undone). Meta Business AI was discussed but not adopted: it skips App Review but loses computations and flow control.

## 5. Topic index (oldest first)
### Facebook connection: done
GAHtest connected 2026-10-16. Meta app is in Development mode (only app-role testers get replies). Add testers: App roles → Tester. Grep: `App roles`.
### Real-estate Bot Studio features: done
Houses page, price switch, lead questions, 30,000-char cap (`MAX_KB_CHARS`, `MAX_CHARS`). Grep: `houseText`.
### Messenger memory: done, confirmed live
`recentMessages` in `api/webhook.js` (21 fetched, 20 kept). Grep: `recentMessages`.
### No echoing the question: done
Prompt rule in `buildPrompt`.
### Facebook restriction #2022: done
The Page was restricted until Nov 16; the user fixed it with a Facebook verification. Grep: `2022`.
### Inbox scan of grabahouseph: done
Real customer questions and freshness tracking; reports in `.orchestrate/inbox-scan.md`. The sample questions in the Bot Studio test chat came from it.
### Staff handover, labels, quiet time: done, confirmed live
The user accepted the label terms (Privacy ToS) on the Page. One label POST failed for one user ("Unsupported request - method type: post"): cosmetic, unresolved. Grep: `Needs agent`.
### Shorter replies, no invented turns or markdown: done
`oneTurn`, prompt style rules. Grep: `oneTurn`.
### Custom handover/waiting messages and quiet time: done
`handoverNote`, `waitingNote`, `quietMinutes` (5 min for testing up to 24 h).
### One financing option at a time: done
`computation: "ask"`. Grep: `computation`.
### Owner-friendly Bot Studio (round 1) + flow switches: done, deployed 2026-10-20
Task home screen, step screens, "How your bot works" (#flow). Report: `.orchestrate/owner-redesign.md`.
### Tap-question buttons (ice breakers): dropped
Built, then fully undone at the user's request. Grep: `ice_breakers`.
### Tripping booking conflict: open (offered)
The tripping info's "To book: ask 1–5" list fights the lead-question order and the handover on visit date. Suggested: trim the info to facts; ask date → mobile → hand over. Grep: `tripping`.
### Prompt injection / off-topic: done, deployed 2026-10-20, live retest pending
The "Let A = 'mal'…" and "similar code" tricks. Self-check covers them with a fake AI. Grep: `TOPIC_RULE`.
### Rate limits (429): explained
Fixes offered: send less per message (10 history messages, relevant houses only), add Llama as an extra Groq fallback, or Groq Dev Tier.
### Meta AI / Business AI: discussed
Pros: no App Review or limits. Cons: less control. Unclear whether it can send pictures. Suggested trying it on GAHtest, never alongside our bot.
### APEX migration guide: done 2026-11-09
`APEX-MIGRATION.md` for the groupmate.
### Bot Studio full redo (new design): in progress
Opus agent rebuilding `index.html` from scratch; report `.orchestrate/redo-ui.md`; backup `.orchestrate/backup/index.before-redo.html`. Follow-up chat "Bot Studio redesign: check and ship" (studio-redo) checks it and deploys after the user's OK.

## 6. Open items and unverified
- Bot Studio redo: waiting on the agent → owner-style check → show the user → deploy.
- The user should retest the injection tricks on the live bot.
- Tripping booking fix (offered, not approved).
- Real houses and prices from the owner (never invent them).
- The knowledge-base "Locations" line "Do not name specific projects or units": delete it once houses are added.
- Going public on grabahouseph: Meta App Review for `pages_messaging` (privacy policy URL, screencast, likely business verification), a new Page token, and turning off Business Suite automated replies/greetings.
- Ideas, not started: house photos in Messenger, a leads list, agent alerts, office hours.

## 7. Gotchas
- Shell heredocs broke regex escapes twice. Use the Edit tool for code with backslashes. Python isn't installed; use Node for scripts.
- A piped `test | tail && deploy` deployed despite a failing test. Run them separately.
- A deploy agent once left out `index.html`. The CLI with `.vercelignore` fixed that.
- `BlobNotFoundError` has no useful `.name`; use `instanceof`.
- A new deployment URL serves a "building" page with status 200 until it's ready. Poll an `/api/*` endpoint.
- Saved settings are merged with defaults on load, so "changed vs before" checks miss the first save.
- Bot Studio's direct hash for the flow page is `#flow` (not `#how`).

## 8. Transcripts (newest first)
- `~/.claude/projects/C--Users-merci-OneDrive-Documents-Projects-chatbot/eab7a987-0e9a-45de-b1a7-94fafa6bf7c7.jsonl`: 2026-10-19 → 11-09. Memory, inbox scan, handover/labels/quiet, reply length, computations, owner redesign, off-topic guard, APEX guide, the start of the full redo.
- `…/02fc70ed-02a5-4524-887e-0ef8856a1784.jsonl`, `…/6aa4354c-0340-4dda-a66d-2272c7b33707.jsonl`, `…/2620ff8e-82de-42b7-8282-e3b127d6bb51.jsonl`: earlier sessions (2026-10-16 and before): Facebook connection, real-estate features, first deploys.

## 9. Last updated
2026-11-09
