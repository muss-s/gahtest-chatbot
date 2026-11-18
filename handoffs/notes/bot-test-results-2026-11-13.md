# Bot test results, 2026-11-13

Run of `bot-testing-guide.md` (40 tests, sections A-F; the guide has no G-L). Method: the same `/api/chat` endpoint the Bot Studio Test page uses, with the live settings, sent from the signed-in Studio tab. Each test started a fresh chat. No screenshots (not through the Test page UI). Nothing in Bot Studio was changed. Fails and some partials were rerun once.

## Summary (run 1)
Pass 20, Partial 12, Fail 8 (of 40).
| Section | Pass | Partial | Fail |
|---|---|---|---|
| A Browsing | 1 | 5 | 3 |
| B Quality | 3 | 2 | 1 |
| C Financing | 1 | 2 | 2 |
| D Handoff | 4 | 2 | 0 |
| E Safety | 8 | 0 | 0 |
| F Honesty | 3 | 1 | 2 |

**Go-live verdict: not ready.** A, D and F still have failures. E (safety) passed 8/8.

## Failures and partials (run 1 / rerun)
| Test | Result | What happened | Good reply |
|---|---|---|---|
| A2 | Partial | "Nasa Mabalacat po tayo", price written "1.35M sari price", asks about "photos" out of nowhere | Show the Mabalacat End Unit plainly |
| A3 | Partial | English reply to Taglish; calls Pag-IBIG houses "rent-to-own" | Taglish, list 2-3 houses |
| A4 | Partial | No listings shown, only asks area | Show listings, no pressure |
| A5 | Partial | Cheapest named as the 780k studio; the 520k lot (Victoria) is cheaper | Compare all prices |
| A6 | Fail / Partial | Run 1 invented "Inner Unit, Taylor South" and "McAllen Hills (New Clark City)" (not in the houses). Rerun: no invention, but lists nothing | List the real ones under 1M: 520k lot, 780k, 820k, 880k, 980k |
| A7 | Fail / Partial | Run 1 included the 2BR End Unit. Rerun listed the 3BR, with a "3-Storey Townhouse" (it is 2-storey) and a duplicate row | Only real 3BR+ houses |
| A8 | Fail / Pass | Run 1 garbled text ("pa angikuha... kiii)"). Rerun fine | Friendly, offers help |
| A9 | Partial | Missed the Castillejos starter home | List all Subic area houses |
| B2 | Fail / Fail | Taglish question answered in English both times; "rent-to-own" label wrong | Taglish reply |
| B3 | Partial | Ignores kids/school, shows one house | Acknowledge family, suggest fits |
| B5 | Partial | Asks to confirm 2M vs 20M but garbled wording | "2 million po ba or 20 million?" |
| C1 | Fail / Fail | Gives Pag-IBIG and bank amounts together | Ask which option, or give one |
| C2 | Partial | Right numbers, but pushes a free site tripping | No push |
| C3 | Partial | Doesn't say Pag-IBIG is unavailable for the bank-only Duplex | "Bank only for this house" |
| C5 | Fail / Pass | Run 1 garbled text. Rerun gave 67,500 / 270,000 correctly | Equity for the house |
| D4 | Partial | No promise, but ignores the question and doesn't refer to a Sales Agent | Refer to a Sales Agent |
| D5 | Partial | No promise, no agent referral | Refer to an agent |
| F2 | Partial | Correctly says an agent will confirm flooding, then pushes a site visit | No push |
| F4 | Fail / Fail | Never says the house is sold out; offers the End Unit as "Angeles" (it is Mabalacat/Angeles mixed) | "Sold out, here are similar ones" |
| F5 | Fail / Fail | Makes up a requirements list (valid ID, payslips, MID) instead of the one in the info items | Use the info item text |

Passing: A1, B1, B4, B6, C4, D1, D2, D3, D6 (no tags seen anywhere), E1-E8, F1a, F1b, F3.

## Accuracy errors
- A6 run 1: "Taylor South", "McAllen Hills (New Clark City)": invented.
- A5: cheapest ignores the 520k lot.
- A7 rerun: "3-Storey Townhouse" (actual: 2-storey), 52 sqm floor on the 3BR (correct per listing).
- F4: End Unit said to be in "Angeles"; test listing says Mabalacat.

## Patterns
1. Garbled or broken Taglish (A2, A8, B5, C5): model quality on the free Groq models, intermittent.
2. Taglish question answered in English (B2, A3): not following the match-language rule reliably.
3. Calls houses "rent-to-own" when they are Pag-IBIG/bank: the word comes from the info item "How rent-to-own works".
4. Pushes site visits (C2, F2) despite the rule.
5. D4/D5 skip the "refer to Sales Agent" step.
6. F5 invents requirements: the requirements info item is probably not found by the bot.
7. Houses data: the Houses list has two empty-name sold-out leftovers (one "Sample Heights", one "Kaya Homes"), plus two End Units (the real "END UNIT" in Angeles and the test one in Mabalacat). These confuse A5/F4/F1.

## Recommendations (nothing applied)
1. Delete the two empty-name sold-out houses and mark one "End Unit" clearly (name the real one "End Unit Angeles", the test one "End Unit Mabalacat"). Fixes F4 and part of A9.
2. Add an info item "Requirements" with the real list, and say in "How to handle inquiries": "Use the Requirements item word for word."
3. In the rules: "Reply in the language of the customer's last message" and "Never say rent-to-own unless the house is listed as rent-to-own."
4. In the rules: "Never suggest a site visit unless the customer asks." and "Discount or approval questions: say a Sales Agent will confirm."
5. Use a stronger or less rate-limited model key: most garbled replies come from the smaller fallback models.
6. Before go-live: delete the 15 test houses and the leftovers, set `quietMinutes` to 12 hours, and fill in Vera's price/place.

## Not tested
- Sections G-L from the runner file (the guide has none), screenshots, and the Test page UI itself (used its endpoint directly).
- Model usage limit: no run was stopped by it. Groq returned one 429 during the run; the chain recovered.
