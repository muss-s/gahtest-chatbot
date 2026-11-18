# Facebook Page Chatbot

When someone messages your Facebook Page, Messenger sends the message to this webhook. The webhook asks a free AI model (Google Gemini by default) for an answer and posts that answer back to Messenger.

```
Messenger user → Facebook → /api/webhook (Vercel) → Gemini → reply → Messenger user
```

All the code is in `api/webhook.js` and it needs no dependencies.

## 1. Get a free AI key

1. Go to https://aistudio.google.com/apikey and sign in with a Google account.
2. Click **Create API key** and copy it. This is your `LLM_API_KEY`.

The free tier has rate limits, which are plenty for a small page. Any OpenAI-compatible provider also works (see `.env.example`). For example, Groq has a free tier too.

## 2. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Then add the environment variables. Make up a random string for `VERIFY_TOKEN` and fill in the others in step 3:

```bash
vercel env add VERIFY_TOKEN
vercel env add LLM_API_KEY
vercel env add PAGE_ACCESS_TOKEN
vercel env add APP_SECRET
vercel --prod
```

Your webhook URL is `https://<your-project>.vercel.app/api/webhook`.

> The variables have to exist before Facebook verifies the webhook. If you add them later, run `vercel --prod` again so the new values take effect.

## 3. Create the Meta app and connect your Page

1. Go to https://developers.facebook.com/apps and click **Create app**.
2. Choose the use case for **Messenger**: "Engage with customers on Messenger from Meta". Pick the business type if Meta asks.
3. Go to **App settings → Basic** and copy the **App secret**. This is your `APP_SECRET`.
4. Open **Messenger → Messenger API Settings**:
   - **Generate access tokens:** connect your Page, then click **Generate**. This is your `PAGE_ACCESS_TOKEN`.
   - **Configure webhooks:** paste your webhook URL as the Callback URL and your `VERIFY_TOKEN`, then click **Verify and save**.
   - On your Page's row, click **Add subscriptions** and tick **messages**.
5. Update the Vercel env vars with the token and secret, then run `vercel --prod`.

## 4. Test it

Message your Page from your own Facebook account (you're the app admin). You should see "typing…" and then a reply.

If nothing comes back, check the logs with `vercel logs <your-project>.vercel.app`.

## 5. Go public

While the app is in **Development** mode, only people with a role on the app (admins, developers, testers) get replies. For the public to get replies:

1. Request **Advanced Access** for the `pages_messaging` permission through **App Review**.
2. Switch the app to **Live**.

Meta asks for a privacy policy URL and a short screencast of the bot working.

## Customising: Bot Studio

Open the site root (for example `https://gahtest-chatbot.vercel.app/`) and sign in with `ADMIN_PASSWORD`. There you can edit the bot's name, tone, language, business info, key facts, rules and fallback message, and chat with it before saving. Saved changes reach Messenger within about 10 seconds.

**Knowledge base:** add sources by pasting text, importing a public web page, or uploading `.txt`, `.md` or `.csv` files. Every source goes to the LLM with each message, and the bot is told to answer only from them. The limit is 30,000 characters in total, houses included. Past that, switch to embeddings search.

**Houses for sale:** one entry per house or model (area, town, status, prices, sizes, rooms, features, notes, "as of" date). They go into the prompt as listings the bot may name. The price switch picks whether the bot quotes the listed prices or leaves prices to an agent; with "agent" the amounts are left out of the prompt entirely. **More settings → Getting buyer details** picks what the bot asks interested buyers.

**Using Ollama instead of Gemini:** set `LLM_BASE_URL` to your Ollama server's `/v1` URL and `LLM_MODEL` to the model name. Vercel can't run Ollama itself, so the server has to be publicly reachable, for example through a tunnel.

Settings are stored in a Vercel Blob store linked to the project (`BLOB_READ_WRITE_TOKEN` is added automatically). Every save writes a new `settings/settings-<random>.json` and keeps the 3 newest. The store is public-read, so anyone who has a file's URL can read it. Don't put secrets in the settings.

- **Memory:** each Messenger message is answered on its own. The test chat in Bot Studio does keep the conversation history.
- **Self-check:** `node test.mjs` runs the webhook and admin APIs against fake Facebook and LLM responses.

## Which AI answers (fallback chain)

Every message tries these in order and moves on when one is busy, out of free quota or unavailable:

1. Groq `openai/gpt-oss-120b`, then `qwen/qwen3.8-27b`, then `openai/gpt-oss-20b` (needs `GROQ_API_KEY`; override with `GROQ_MODELS`, comma-separated)
2. Gemini `gemini-3.8-flash` as the last backup (needs `LLM_API_KEY`; override with `LLM_MODEL`)

Models get retired: if every reply fails, Bot Studio's test chat shows each model's error, and `/api/status` (admin password needed) lists the models your Groq key can use. The knowledge base is capped at 30,000 characters so a single message fits Groq's free per-minute limit.
