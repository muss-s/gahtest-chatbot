# Bot Studio owner redesign (2026-10-20)

Only `index.html` was changed (`preview.mjs`, `lib/`, `api/` and `test.mjs` were not touched). `node test.mjs` passes. Nothing was deployed. Backup: `.orchestrate/backup/index.before-owner-redesign.html`.

## What changed (index.html, 2000 lines)
- **CSS 55-126**: the left side menu is gone. There is now a slim top bar (brand goes home; "Test your bot" button below 1180px), plus styles for the home task buttons, reminders, task screen headers ("← Back to home", "Step 1 of 2"), the house picker, sold-out rows, the "How your bot works" steps with "Change" boxes, radios, and lead-question rows with ↑/↓. The house card has modes (`.m-info` / `.m-prices`). The save bar is hidden on the house screen, because that screen has its own Save button.
- **CSS ~280-305 (media queries)**: below 1180px the chat becomes an overlay. Below 760px there is one column of tasks, "Change" buttons wrap under the sentence, the chat header is compact, and the save bar says "Not saved yet / Undo / Save changes".
- **HTML 338-660**: these screens (`data-view`):
  - `home`: "What do you want to do?", a summary line, reminders, 7 task buttons, the setup status, "See all your houses" and Sign out.
  - `house`: add a house in 2 steps, or change one house's prices.
  - `prices`: Step 1, "Which house?".
  - `status`: sold out or available.
  - `knows`: Add or change information. "More information" comes first, with "Use a ready-made text" as the first tile, then Main details.
  - `flow`: How your bot works.
  - `more`: name, tone, language, rules, the "something went wrong" message, a link to How your bot works, "For your developer", and Sign out.
  - `houses`: all houses, the old full list. It keeps Needs checking, project groups, copy and delete.

  Buttons say what they do: "Save changes", "Undo changes", "Start over", "✕ Close", "Copy this page", "Add it", "Use these amounts", "Delete this house".
- **JS 757-769**: `LEAD_SAY` (question wording for the story), `HANDOVER_LABELS` (the same keys as `HANDOVER_TRIGGERS`), `DEFAULT_HANDOVER`, and the `edit` state.
- **JS ~945-970 `load()`**: now also loads `handoverWhen`, `whileWaiting` and `computation`. It calls `syncRadios()` and `renderHandover()`, and re-draws the house screen after a save. There is generic radio binding (`input[type=radio]` name = setting).
- **JS 1116-1238**: `byProject`, `emptyBox`, `renderStatusList` (Available / Few units left / Sold out chips with Undo toast, "Mark all sold out"), `renderPricePick`, `startAddHouse`, `editPrices`, `renderEditor` (Step 1 of 2 / Step 2 of 2, "Next: prices →", "Save this house" / "Save new prices"), and `saveAndHome`.
- **JS 1310-1350 `houseCard(house, mode)`**: fields are tagged `.pi` (house) or `.pp` (prices). In the focused screens the summary, copy and delete are hidden, and the project-move re-render is skipped. "Prices as of" still updates itself through `touchPrice`.
- **JS 1594-1690**: `renderLeads` (ticked questions in asking order with ↑/↓, focus follows the moved item, unticked ones under "Not asked"), `renderHandover`, `renderFlow` (the numbered story from current settings, re-run on every change through `updateSaveBar`), and the "Change"/"Done" toggles.
- **JS 1841-1909**: `renderHome` (reminders: "Not saved yet" with Undo/Save, "N houses have prices older than 30 days → Check them", "No houses yet → + Add a new house", "no information → Add information"), the new `route()`/`currentView()` (default `home`, old `#talks` → `more`, an empty "Add a new house" is dropped when you leave it, `#house` without context → home), and the delegated `data-go`/`data-home` clicks.
- Kept unchanged: sign-in, `/api/settings` GET/PUT, `/api/chat`, `/api/status` banner, `/api/import`, paste computation parser, project grouping, starters, size meter, undo toasts, unsaved-changes guard, Ctrl+S, and dark mode. The "Needs checking" Edit button now opens "Change price" for that house.

## Owner tasks (taps counted from the home screen, typing not counted)
| Task | Taps | Verified at 1280 | Verified at 375 |
|---|---|---|---|
| Add a house with two payment options | Add a new house, type name/project/place, Next, + Pag-IBIG (type price), + Bank or Paste computation → Fill in → Use these amounts, Save this house = **5 to 7** | yes: Scarlet, Pag-IBIG typed and Bank pasted, saved and back home with toast | yes: Kaya, In-house + Pag-IBIG |
| Change a price | Change a price, tap house, edit price, Save new prices = **4** | yes: "as of" jumped from 2026-08-01 to today and the "older than 30 days" reminder cleared | yes |
| Mark sold out and back | Mark a house sold out or available, Sold out, Save changes; Available, Save changes = **3 + 2** | yes (also Ctrl+S) | yes |
| Add information from a starter | Add or change information, Use a ready-made text, pick one, Save = **4** | yes: Pag-IBIG requirements | yes: Site tripping booking |
| Change handover rules | How your bot works, Change (step 4), tick or untick, Save = **4+** | yes: contact, person, unknown; also whileWaiting=wait, computation=all | yes: back to contact, visit, person; help; ask |
| Reorder lead questions | How your bot works, Change (step 3), ↑/↓, Save = **4+** | yes: budget moved first, work unticked | yes: visit moved above contact |
| Test the bot | Test your bot, type, Send = **2** (the chat column is always visible at 1280) | yes | yes: full-screen chat with ✕ Close |
| Save, reload, persist | | yes: `/api/settings` had the expected `handoverWhen`, `whileWaiting`, `computation`, `leadQuestions` order, sources and prices; after reload the radios, checkboxes and story matched | yes, same check |

- **No sideways overflow at 375:** `scrollWidth` was 375 on home, prices, status, knows, flow (all Change boxes open), more and houses, and on the house screen.
- **Console:** only old entries are left (401s from before sign-in, from earlier sessions, and one syntax error from a mid-session edit that I fixed). After the fix every request returned 200 and the page ran without errors.
- **Viewport:** reset to "desktop" at the end. Tab `seed` was never touched.

## Known gaps
- Accessible names: payment-option inputs are wrapped in `<label>`, but the accessibility tree reports their placeholder rather than the label text. Screen readers may read "e.g. 1,200,000".
- The test-chat question menu still takes about half the phone screen until it is hidden (this was already true before). Typing a question doesn't close it; tapping a ready question does.
- "Copy this house" and "Delete this house" only live under "See all your houses". There is no dedicated home task for them.
- `/api/import` ("Copy from a website") could not be tested: the preview returns 404 for it, and the page shows its human error.
- The "set up / Facebook" status box now sits under the task buttons on home. The Facebook App Review note is unchanged.
- The tap counts above are estimates from the flows I clicked. I did not test with a real non-technical user.
