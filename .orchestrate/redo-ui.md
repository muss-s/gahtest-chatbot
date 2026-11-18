# Bot Studio redo (index.html rebuilt from scratch)

Status: DONE. Only `index.html` changed (single file, inline CSS + JS, Google Fonts link). Not deployed.
Backup of the old page: `.orchestrate/backup/index.before-redo.html`.

## Design decisions
- Feel: a real-estate office, not a form app. Deep forest green (`#1F5240`) on warm cream (`#F5EFE3`), with one terracotta accent (`#B9572A`, roof-tile colour) for "needs attention" items and the logo. Headings in Fraunces (a warm serif), body text in Figtree at 17px.
- Motif: rooflines. The logo is a small house; outline roofs sit in the sign-in panel and the Home greeting; every house card has a thin roof-peak strip on top, coloured by status (green available, amber few left, grey sold out).
- Light and dark mode through CSS variables and `prefers-color-scheme`. Dark mode uses a lighter green so contrast stays good.
- Phone: bottom tab bar (Home, Houses, Info, Test, Your bot). Computer (900px and wider): a left sidebar with the same five items plus Sign out. Content goes up to about 920px wide.
- Tap targets are at least 44px (most are 48–50px). Every input has a label. Focus rings are visible. Toggles use `aria-pressed` and the Change buttons use `aria-expanded`/`aria-controls`. The meter has a progressbar role.
- One clear main action per screen: Home = "Add a new house"; Houses = "Add a house"; inside the house editor = Next / Save.

## Screens
- **Sign in**: brand panel with a roofline drawing; password with Show/Hide; "Keep me signed in on this device"; plain-words error.
- **Home**: time-of-day greeting and a one-line summary of what the bot knows. Reminders: not saved yet (with Undo all / Save), too much to save, prices older than 30 days (names the houses), space almost full, no houses, no business information. Then the big task buttons: Add a new house, Change a price, Sold out or available, Add or change information, Test your bot, How your bot works. Then the setup check (switched on / Facebook connected / has information; Development-mode note under "For your developer").
- **Houses**: cards grouped by project, each group with "+ Add a house here" and "Mark all sold out". Each card shows a status pill, a "Check price · N days old" badge, name, town and area, the lowest price large ("From ₱…" when there are several), the lowest monthly payment, bedrooms/floor/lot, financing tags, and a 3-way status bar (Available / Few units left / Sold out, one tap with Undo). Also: a "Prices to check" box (Still correct / Change price), search when there are 4+ houses, the space meter, and an orange dot on the Houses tab when prices are old. "Change a price" and "Sold out or available" from Home open this screen with a banner saying what to tap; in price mode a card opens straight on the Payment step.
- **House editor** (full-screen on phones, 620px side panel on computers; phone Back button and Esc close it): 3 steps, Name and place → Details → Payment.
  - Adding: Step 1 of 3, with Next/Back. The model name is required. Area has quick chips (Pampanga, Tarlac, Bataan, Subic) plus suggestions. Payment has one card per financing type (+ Pag-IBIG / + Bank / + In-house, at most 3, one of each), "Paste a sample computation" with a review step (old parser kept as-is), and "Prices as of", which changes to today by itself.
  - Editing: the steps become tabs, with Close / Save changes (or Done when nothing changed), Copy this house, and Delete this house (with Undo).
  - A blank new house is dropped when the editor is closed.
- **Info ("What your bot knows")**: space meter; 4 tiles (Use a ready-made text, Type or paste, Copy from a website, Upload a text file, plus drag and drop). Items are expandable cards (title, text, letter count, Draft banner with "It's checked", Delete with Undo), with search at 4+ items. Below them, "Main details": About your business, and Important details to always mention.
- **Test**: Messenger-style chat (blue bubbles on the right, grey on the left, round avatar with a green "online" dot, typing dots). A light-bulb button opens the sample questions by topic (all 7 topics and questions copied from the backup). Also: "Not right? Tell the bot what to say" (adds a rule and jumps to the rules box), Start over, and a note that unsaved changes are used. "LLM 429" and the other errors are mapped to plain words, with details under "For your developer".
- **Your bot**: "How your bot works" as a numbered timeline of sentences built from the current values, each with a Change button that opens its controls in place:
  - questions it asks (tick + up/down order)
  - when it passes a chat to the team + the message it sends then
  - while waiting (keep helping / send the waiting message once) + the waiting message
  - quiet time (5 min "for testing" up to 24 h)
  - prices shared or left to an agent; the computation mode is hidden when an agent gives prices
  - below that, "More about your bot": name, tone chips + own words, language chips + own words, always/never rules, the "can't answer" message
  - Sign out, and "For your developer" (webhook link, setup check, Groq models list)
- **Always on**: save bar ("Not saved yet…", Undo all, Save changes; turns red and blocks saving when over the 30,000 limit), toasts with Undo, in-page dialogs, Ctrl/Cmd+S, a warning before leaving with unsaved changes, and old links (#knows, #flow, #more, #prices, #status, #house) sent to the new screens.

## Kept unchanged from the backup (logic)
API calls and headers, signIn and remember-me storage wrappers, migrate(), load(), houseText/countChars/overBy (same counting as lib/bot.js), plain() error mapping, parseComputation(), STARTERS, QUESTIONS, LEAD/HANDOVER labels, every validation and message: name required, max 3 options with one per type, file type and size checks, URL import error, too-big save block, the 401 messages.

## Verified (local preview `node preview.mjs .`, built-in browser, 375x812 dark + 1280x800 light)
- Wrong password: the sign-in error shows and the app stays hidden. Right password + remember: the app opens.
- Add a house: "Next" without a name shows the error and focuses the name box. Then name, project, Pampanga chip, town → Details (few units left, 3 bedrooms, 88 sqm) → Payment (+ Pag-IBIG 1,800,000 / 9,500, + Bank 1,650,000 / 12,300) → "Save this house": saved, editor closed, toast shown. The card shows "From ₱1,650,000".
- Change a price from Home: banner shown → the card opens on Payment → edit → Save changes → saved.
- One-tap Sold out on the card: status changes, save bar appears, toast offers Undo.
- Info: ready-made text added as a Draft; Type or paste added an item; meter at 5%. Pushing a 31,000-letter item: the meter turns red and names the 3 biggest items, Save is disabled, and the save bar says how much to remove. Copy from a website: the preview server has no import endpoint, so it showed the friendly error.
- Test chat: tapped a sample question (Prices topic) → user + bot bubbles appeared. A typed message also worked. "Not right?" added the rule line and opened Your bot.
- Every How-it-works item changed (reorder/untick questions, + "can't answer" handover with a new message, waiting mode with a new message, 5 min, agent ↔ share, send all). The sentences update live. Name, tone, language and fallback changed. Saved.
- Real page reload (`location.reload()`, confirmed to be a fresh page): every value above persisted and remember-me signed back in.
- Stale price (asOf 2026-09-01): Home reminder, tab dot, "Prices to check" box, card badge "69 days old"; "Still correct" clears it. "Undo all" restores the saved state.
- Ctrl+S saves.
- No horizontal scroll at 375px on all 5 screens (with all Change boxes and info cards open; scrollWidth = 375).
- Desktop: sidebar layout, house editor as a side panel, Messenger-style chat. Light mode looks right.
- Console: no script errors (only the expected 401 from the wrong-password test and 404 from /api/import, which the preview server doesn't implement).
- `node --check` on the inline script: OK. `node test.mjs`: "all checks passed".

## Known gaps / notes
- Real /api/import, /api/status warnings (with something missing) and the LLM 429 message were not exercised live (the preview server mocks these as always-OK or doesn't implement them); their code is the backup's.
- The browser "Leave site?" warning (beforeunload) was not triggered by hand.
- The lowest monthly payment on a card can come from a different financing option than the lowest price; it is labelled "from ₱… a month" when there are several.
- Removed from the backup UI: the separate "All your houses" list view. Its features (copy, delete, project groups, mark all sold out, search) live on the Houses screen and in the house editor.
- Screenshots in the built-in browser pane were scaled oddly; layout checks relied on measured sizes (scrollWidth, element bounds) plus the screenshots.
