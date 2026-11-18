# Bot Studio audit (2026-10-19)

Read-only audit. No project file was edited. Sources: `index.html`, `lib/bot.js`, `.orchestrate/inbox-scan.md`, and the preview at http://localhost:5178 (tab-2) at 1280 wide and 375x812. In the preview I signed in, added a test house, sent a test-chat message, forced a save failure, and went over the size limit. The preview viewport was reset to desktop afterwards.

Overall: the page is clean, friendly and mostly jargon-free. Tap targets are 40-44px and nothing overflows sideways at 375px. The weak points are usefulness more than looks. A house can't be entered the way the team actually quotes it. Nothing tells staff when a price is old. On a phone, the save bar and the "Try your bot" button cover a large part of the screen.

## Top problems, ranked by impact

1. **Houses can't hold a "Sample computation".** `index.html:628-634` has only Total price, Reservation fee, Down payment, Monthly payment and Prices as of. The team's reply is always Price, Reservation fee, Processing fee (+ monthly split), Equity (+ monthly split), Loan value, Monthly amortization, Term, and Financing type (Pag-IBIG / Bank / In-house). The same model often has different prices per financing type: Scarlet is 5M with Pag-IBIG and 5.7M with a bank loan. There is also no Project field. The name placeholder "e.g. Bella model, Sunrise Homes" (`:624`) mixes the model and the project into one box. *What staff experience:* they cram the processing fee, equity and term into "Down payment" or "Notes", or they give up and paste the whole block into "More information". The bot then gets two competing copies of the price. *Note:* the server keeps only the fields in `HOUSE_FIELDS` (`lib/bot.js:59-64`, `:119`), so new fields also need a small change in `lib/bot.js`.

2. **Nothing shows which prices are old.** "Prices as of" is set to today only when a house is *added* (`index.html:707`). It does not change when a price is edited later (`:665-673`). "Copy this house" carries the old date forward (`:675`). The collapsed house row shows area, town and price but not the date (`:656`), and there is no "older than 30 days" warning anywhere. *What staff experience:* the inbox shows prices changing every few weeks (Bloomfield 9M, then 8.9M, then 8.6M within 5 weeks). Staff can't tell which houses need re-checking without opening every card, so the bot quietly quotes stale prices.

3. **The phone layout covers a lot of the screen.** At 375x812 the sticky top menu is 139px tall (`:170-172`). The save bar wraps "You have unsaved changes" onto 4 lines and is 116px tall (measured; `:154`, `:166`, `:378`). It sits directly above the 52px "Try your bot" button (`:165`). Together, about 300px of the 812px screen is covered by fixed bars. The save bar sits on top of the field being typed in (seen over "Monthly payment" and "Prices as of"). Sign out is hidden on phones entirely (`:173`).

4. **The status banner says "ready and replying on Facebook" when it may not be.** `:837` shows "✅ Your bot is ready and replying on Facebook." whenever the setup checks pass. The Meta app is in Development mode (CLAUDE.md "Open"), so real customers get no reply. *What staff experience:* false confidence. They assume customers are being answered.

5. **The page gives two different answers about where prices go.** The page intro says "Add your prices, projects, requirements…" (`:222`), and the empty list says "add your price list, projects or FAQs" (`:540`). But the card says "Put each house under Houses for sale" (`:241`), and the bot treats the houses list as stronger when the two disagree. *What staff experience:* the same prices get entered twice, in two places that go out of date separately.

6. **Save failures show raw technical errors in a browser popup.** `save()` uses `alert()` (`:812`). `plain()` only rewrites the size-limit and AI-key errors (`:426-431`). Any other server error is shown as is. Forced test: "Couldn't save: Internal Server Error: BlobError token". The popup also blocks the page on a phone, and there is no "Try again" button.

7. **Going over the 30,000-character limit is a dead end.** The meter says only "Too much information. Please remove some." (`:586`). It doesn't say how much is over or which item is biggest: each item shows only Short/Medium/Long (`:439`). Save stays enabled (`:801-807`), so staff find out only when the save fails. The 30k limit is shared with houses, but "Medium" covers anything from 1,000 to 9,999 characters.

8. **The test chat doesn't fit how customers actually write.** The suggested questions (`:390`) are "Magkano po?" and similar. Real customers mostly tap ad buttons: "What is the price? And location you serve?", "Can I get a sample computation for Scarlet…", "Can I book a tripping?", "Can I avail if I am not a Pag-IBIG member?". The test chat also uses the *unsaved* edits (`:885`), but nothing says so. Staff may think "it answered correctly" means it is live. The suggestions disappear after the first message and come back only with "Clear" (`:855`, `:901`).

9. **The language and tone boxes fill with instruction text.** Picking "Same as the customer" puts "Reply in the language the customer uses (English, Tagalog or Taglish)." into the "Or type your own instruction" box (`:320-325`, `:513`). Tone puts in "casual and relaxed" (`:311`). It is unclear whether staff should edit that text. "Message when something goes wrong" defaults to an English-only sentence (`:350`), while the customers are Taglish.

10. **The team's own formats aren't supported.**
    - Only .txt/.md/.csv uploads work (`:247`, `:773-775`). The team's "available list" files and price sheets are PDFs.
    - "Type or paste" makes an item called "New information" (`:741`). Nothing prompts for a title or suggests what belongs there.
    - There are no ready-made starters for the reused templates (Pag-IBIG requirements, step-by-step process, site-tripping form, financing options).
    - Lead questions say "Pag-IBIG or bank financing" (`:395`), but the team offers in-house too.

Smaller issues:
- "About your business" is only 96px tall (`:36`). The text already in it is cut off behind a scroll bar.
- Delete and undo use browser `confirm()` popups (`:569`, `:677`, `:820`).
- Signing out with unsaved changes triggers the browser's generic "Leave site?" warning (`:479`, `:822`) instead of a plain-words prompt.
- There is no saved-history or "who changed what", even though the server keeps 3 versions (CLAUDE.md).

What already works well: plain wording throughout, a "For your developer" area kept separate (`:352`), the wrong-password message (`:463`), the empty states (`:540`, `:602`), the shared space meter on both pages, "Copy this house", search appearing once there are 4+ items, the Ctrl+S shortcut, and the warning before leaving with unsaved changes.

## Proposed improvements

### Quick fixes (wording, layout, small)
| # | What the user would see | Size |
|---|---|---|
| Q1 | Phone save bar: a single line ("Not saved" + Save), full width at the bottom. "Try your bot" moves into the top menu or shrinks to an icon while there are unsaved changes. | S |
| Q2 | Sign out is available on phones (for example, at the end of the menu). | S |
| Q3 | The banner says "Bot is set up. Facebook replies: only for test accounts until Facebook approves the app." until App Review is done. Make it a setting or a status flag. | S |
| Q4 | One clear rule in the text: "Prices for each house go in Houses for sale. Use this page for requirements, steps, and FAQs." Fix lines 222 and 540 to match. | S |
| Q5 | "Prices as of" updates itself whenever a price field changes. The collapsed house row shows "Prices as of Oct 2" and turns amber after 30 days ("Check this price"). | S |
| Q6 | Starter questions copied from the real ad buttons: price & location, sample computation, tripping, non-Pag-IBIG. Plus a note: "Uses your unsaved changes." | S |
| Q7 | Language and tone chips stop writing the instruction text into the box. The box stays empty unless staff type their own. | S |
| Q8 | Save errors appear in a message on the page with a "Try again" button. Unknown errors say "Couldn't save. Please try again; if it keeps happening, tell your developer." The technical detail goes under "For your developer". | S |
| Q9 | Over the limit: "About 1,200 characters too many. Biggest items: Price list (9,800), …". The size per item is shown as a number or a bar, and Save is disabled with the reason shown. | S |
| Q10 | Lead question reads "Pag-IBIG, bank or in-house financing". The default "something went wrong" message is in Taglish. | S |
| Q11 | Taller "About your business" box that grows with its text. | S |

### Bigger improvements (inside the existing page, no new backend)
| # | What the user would see | Size |
|---|---|---|
| B1 | **House form that matches the team's "Sample computation"**: Project, Model, Financing (Pag-IBIG / Bank / In-house), Price, Reservation fee, Processing fee + "pay over N months", Equity/Down payment + months, Loan value, Monthly amortization + term in years. Each house can hold more than one financing option. Needs a small `lib/bot.js` change (`HOUSE_FIELDS`, `cleanSettings`) and the self-check. | M |
| B2 | **"Paste a sample computation"** button: staff paste the block they already send on Messenger, and the form fills itself in (simple pattern matching on "Price -", "Reservation Fee-", etc.). Staff check the result before keeping it. | M |
| B3 | **"Needs checking" list** at the top of Houses: houses whose prices are older than 30 days. Each has an "Still correct" button (updates the date) and an "Edit" button. | S-M |
| B4 | **Group houses by project** (Fiesta Porac 3, Mansfield, Hauslands Pampanga…), with a one-tap "mark whole project sold out". | M |
| B5 | **Ready-made starters** under "More information": Pag-IBIG requirements, Step-by-step buying process, Site tripping, Financing options, Fees before move-in. Each opens with the team's usual wording and must be confirmed before saving (never invents prices). | S-M |
| B6 | **Test chat improvements**: a "Try a real question" menu grouped by topic, a "Compare with what's saved" toggle, and a quick "Was this right? / What should it say?" note per reply that copies into "Things your bot should always or never do". | M |
| B7 | **First-time guide**: 3 numbered steps on first sign-in (1 Business basics, 2 Add your first house, 3 Try a question). Each shows a check mark when done. | M |
| B8 | Replace the browser popups (confirm/alert) with in-page messages, and add a short "Undo" after deleting an item. | S |

### Needs new backend
| # | What the user would see | Size |
|---|---|---|
| N1 | **Leads list**: name, number, location, budget, preferred tripping date collected by the bot, with a "Contacted" tick and copy-to-clipboard. Needs storage, privacy handling, and possibly notifications to agents. | L |
| N2 | **Recent conversations / questions the bot couldn't answer**: a list of customer questions where the bot said "I'll ask the team". Staff can click "Add an answer". This is the best way to find missing knowledge. | L |
| N3 | **Saved history and restore**: "Last saved by … on …", and "Go back to the version from Oct 12" (the server already keeps 3 versions). | M |
| N4 | **PDF and Word upload** (price sheets, available lists), with the text pulled out on the server. | M |
| N5 | **Tripping booking hand-off**: the bot sends the completed tripping form to an agent (Messenger message or email), and Studio shows the booking. | L |
| N6 | **Staff accounts** instead of one shared password, so changes show who made them. | M-L |

## Decisions for the owner

1. **Where do prices live?** (a) Only in Houses for sale, with "More information" for everything else (recommended). (b) Both, with houses winning when they disagree (current behaviour). (c) A single "Price list" page per project.
2. **What should the bot do with a price older than N days?** (a) Still share it, adding "as of [date], please confirm with an agent". (b) Stop sharing it and hand off to an agent. (c) Share it with no warning (current behaviour).
3. **How should prices for different financing types be shown?** (a) One house entry with several financing rows (Pag-IBIG / Bank / In-house). (b) A separate entry per financing type (simplest; the "Copy this house" button already supports it). (c) Pag-IBIG only, others "ask an agent".
4. **Should the bot send full sample computations or only a summary?** (a) Full computation, like the team's template. (b) Price + reservation + monthly only, with "an agent can send the full computation". (c) Staff choose per house.
5. **Should the bot collect leads (names, numbers)?** (a) Yes: store them in Studio (needs N1 and a privacy notice). (b) Yes, but forward each one straight to an agent and store nothing. (c) No: the bot only asks people to message an agent.
6. **Studio language:** (a) English (current). (b) Taglish labels. (c) A switch between English and Tagalog.

## Not done or not verified
- Real LLM replies were not checked: the preview returns a fake echo of the prompt.
- The 760-1180px tablet layout and the dark/light colour contrast were not measured.
- Keyboard and screen-reader checks were only partial.
- The visual check at 1280 wide was limited (the pane scaled the page down). Desktop findings come from the code and the page structure. Phone findings come from real 375x812 screenshots.
