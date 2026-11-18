# Data contract: Bot Studio redesign (2026-10-19)

Shared by the backend agent (`lib/bot.js`, `api/status.js`, `test.mjs`) and the UI agent (`index.html`). Don't change it without telling the manager.

## House (an item in `settings.houses`)
```
{
  name,        // house model, e.g. "Scarlet"
  project,     // NEW, e.g. "Mansfield Residences"
  area, town, status,              // status: "available" | "few units left" | "sold out"
  lotArea, floorArea, bedrooms, bathrooms, features, notes,
  asOf,        // "YYYY-MM-DD", the date the prices were last checked
  options: [   // NEW, 0 to 3 items, one per financing type
    {
      financing,        // "Pag-IBIG" | "Bank" | "In-house" | "" ("" = not stated)
      price,            // total contract price, free text ("5M", "1,200,000")
      reservation,      // reservation fee
      processingFee,
      processingMonths, // e.g. "12": processing fee payable over N months
      equity,           // equity / down payment
      equityMonths,     // e.g. "12"
      loanValue,
      monthly,          // monthly amortization
      term              // loan term in years, e.g. "30"
    }
  ]
}
```
- All values are strings, trimmed, at most 200 characters (features and notes at most 1000).
- **Old saved houses** keep working: if a house has no `options` but has any of the old `price`, `reservation`, `downPayment` or `monthly`, `cleanSettings` turns them into one option `{ financing: "", price, reservation, equity: downPayment, monthly }`. The old top-level money fields are then dropped.
- Options whose money fields are all empty are dropped. The same financing type can't appear twice (keep the first one).

## Prompt rules (`buildPrompt`)
- House line: `- <name> (<project>): Area: ..; Town/city: ..; Status: ..; ...` (project in brackets only when set).
- `pricing === "share"`: one indented line per option, e.g.
  `  Pag-IBIG: Total price 1,200,000; Reservation fee 5,000; Processing fee 130,000 (payable over 12 months); Equity 41,190.00 (payable over 12 months); Loan value 1,158,810.00; Monthly amortization 7,600.94; Term 30 years`
  Empty parts are left out. A financing of "" is shown as `Price`.
- `pricing === "agent"`: no amounts at all. Only `Financing: Pag-IBIG, Bank` (the types present).
- Old prices: when `asOf` is more than 30 days before today, add ` (prices as of <asOf>, older than 30 days)` to the house line. The prompt tells the bot: for such houses, still share the amounts, but always say they are as of that date and that an agent will confirm the latest price.
- Share mode with houses: the prompt tells the bot that when a customer asks for a computation, it sends the full computation for the matching house and financing type, as plain text with one item per line (like "Price - 1,200,000"), never inventing any missing item.

## Other backend changes
- `LEAD_QUESTIONS.payment` = "how they plan to pay (Pag-IBIG, bank or in-house financing)".
- `DEFAULT_SETTINGS.fallback` = "Pasensya na po, hindi ako makasagot ngayon. Paki-try ulit mamaya, o tumawag sa 0932 424 4949."
- `GET /api/status` adds `facebookPublic: Boolean(process.env.FACEBOOK_PUBLIC)`. It's false until Meta App Review is done. The UI says replies only reach test accounts while it's false.
- `cleanSettings` and `houseText` are exported (`houseText` is used for the size count).
