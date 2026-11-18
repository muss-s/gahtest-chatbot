# Grab A House inbox scan (Messenger), for chatbot knowledge base

**Nothing here is confirmed current; the user must confirm before it goes into the bot.**

Read-only scan of Meta Business Suite inbox, Page 113356243749984. No replies, no assignments, nothing clicked except opening conversations and scrolling the list.

## 1. Coverage

- Date range: newest conversation 30 Sep 2026; oldest about 29 Jun 2025. The list shows no year for older rows; years for rows older than Sep 2026 are inferred from list order (newest first), so treat them as approximate. Dates are the conversation's last-activity date from the list; per-message dates were not captured, so "date the team said it" means "conversation last active on".
- Conversations opened and read: about 100 distinct (106 opens, some repeats). About 12 opened but showed no message text (did not load or media only), so they are not counted in the analysis.
- Skipped as unread: 0 detected. Unread detection was by bold text in the list; none of the rows showed bold, so either everything was read or the marker was not detectable. Treat "0" as unverified.
- Out of scope and not read: Facebook comments, Instagram.
- Newest conversation date used for "Freshness": 30 Sep 2026. "recent" = latest mention on or after 31 Aug 2026.
- Prompt-injection check: no message contained instructions aimed at an assistant. Several threads (two large ones) are internal/agent-style threads containing pasted price sheets and customer data forms; customer data was not recorded.

## 2. Most common customer questions (rough counts of about 100 conversations)

Most customers arrive from Messenger ads and tap fixed quick-reply buttons, so the first question is usually one of these exact texts:

| Topic | Approx count | Typical question (paraphrased or button text) |
|---|---|---|
| Locations | about 45 | "What is the price? And location you serve?" (about 35); "Do you have other properties in San Fernando, Pampanga?" (about 10); which areas (Angeles, Dau, Mabalacat, Mexico, Porac, Subic, Olongapo, Zambales, Bataan, Tarlac) |
| Prices / computations | about 40 | "Can I get a sample computation for Scarlet - Mansfield Residences?" (about 13); "What is the total contract price of Bloomfield?" (about 8); Russet price (about 6); "Can I get a list of payment terms and options?" (about 10); cheapest or 3M-and-below units; bungalow single detached 3BR |
| Payment terms | about 12 | "Can I avail if I am not a Pag-IBIG member?" (about 12); can 10 or 15 years be used for monthly amortization; what is paid first, processing fee vs monthly; is processing fee refundable; other fees (electric, water, subdivision) |
| Pag-IBIG / bank loan | about 10 | Is Pag-IBIG approval guaranteed; does 26k basic income qualify; sample computation for bank loan; in-house option |
| Requirements / documents | about 5 | List of requirements; what is needed at reservation |
| Site tripping / visits | about 20 | "Can I book a tripping?" (about 12); "Is there a viewing schedule for Britt Hauslands Pampanga?" (about 3); "Is Marigold available for viewing today?" |
| Unit photos / actual house | about 5 | "Picture of unit?", "Can you share photos of the units?", "Can I see the actual house model?" |
| Availability | about 6 | Is the unit still available; is Hauslands Mabalacat available; how many units in a phase; when can we move in |
| Other | about 4 | A financing company asking to be accredited by the Page (not a buyer); someone asking for a pricelist; someone asking about open house |

## 3. How the team answers (with templates)

Freshness here is the conversation date of the latest sighting. See section 4 for figures.

Automatic replies (every conversation starts with one of these, so a bot should not repeat them):
- "Hi [first name]! Please let us know how we can help you."
- "Hi, thanks for contacting us. We've received your message, please wait for a while until we see your inquiry, thank you!"
- "Hello! Welcome to Grab A House! feel free to send us your questions."
- Follow-up: "Hi [name], we wanted to follow up. Do you have any questions?"

**Locations and price range ("What is the price? And location you serve?").** Reused verbatim many times between 29 Jun 2025 and 14 Sep 2026 (latest seen 14 Sep 2026, so freshness: recent), standard reply:

> Our monthly amortization starts from 2,600 up to 20,000 depends on type of financing ( PAGIBIG OR INHOUSE), type of house, and location. We offer Rowhouse, Townhouse, Duplex Bungalow,  Duplex Two Storey, Single Attached, Single Detached. Our prime locations are Paralaya Porac, Dapdap Mabalacat, Sabanilla Mexico, Calulut Sfdo, Mining Angeles City, Dau. At ang bagong "THE HAUSLANDS MABALACAT"  beside Don Bosco. Maari ko po bang malaman saan location hanap nyo para isend ko sa inyo ang details.

Then the agent asks which location, and sends details for that location. Variant opener used by one agent (14 Sep 2026): "Good day po / This is [agent first name] from Fiesta Communities. Meron po kami sa Mabalacat, Dau, Porac Mexico at San Fernando. At ang bagong magbubukas na "THE HAUSLANDS MABALACAT" beside Don Bosco. Maari ko po bang malaman saan location hanap nyo para isend ko sa inyo ang details."

Location answers given: Fiesta Communities Porac (Manibaug / Paralaya), Dapdap Mabalacat (near Mabalacat gate exit / Dau), Mexico (Sabanilla, near SM Pampanga, NLEX Mexico exit), San Fernando (Calulut), Subic, Bataan, Tarlac, Angeles (Mansfield Residences near SM Telabastagan along Friendship highway; Bloomfield Timog Residences; low-rise condo units), The Hauslands Pampanga (near NLEX Mexico exit), The Hauslands Mabalacat (beside Don Bosco, Duquit Dau), The Hauslands Clarkway (Clark). On 25 Sep 2026 the team listed: "We have here at angeles city , bataan, subic , tarlac and san fernando".

**Sample computation, Fiesta Communities Porac 3 (Pag-IBIG).** Sent verbatim 28-30 Sep 2026 in many conversations:

> *Sample computation*
> Fiesta Communities Porac 3 Pagibig housing loan  House model- Kaya 2br  Price - 1,200,000 Reservation Fee- 5,000 Processing Fee - 130,000 1yr to pay - 11,666.67/month Equity - 41,190.00 1yr to pay - 3,398.33 per month  Loan value - 1,158,810.00 Monthly Amortization - 7,600.94

> *Sample computation*
> Fiesta Communities Porac 3 Pagibig housing loan  House model- LAYA Terreces 3BR Price - 2,800,000 Reservation Fee- 20,000 Processing Fee - 215,000 1yr to pay - 32,500/month Equity - 0 Loan value - 2,800,000 Monthly Amortization - 18,365.95 for 30yrs  term

Also: when a customer said they had no Pag-IBIG loan, the team said: "Open for pagibig and inhouse financing maximum term of 15 & 30 yrs  term". When asked for a 15-year amortization: "estimated 15yrs term 23,000 per month" (30 Sep 2026, once; for Laya 3BR presumably, not stated).

**Sample computation, Scarlet / Mansfield Residences.** Sent verbatim 8-29 Sep 2026:

> Price package | scarlet Model | Price  5M | Reservation fee 30,000 | Monthly Amort - 26,000 for 30yrs term

Bank version (12 Sep 2026): "Price package | scarlet Model | Bank Loan | Price 5.7M | Reservation fee 30,000 | Monthly Amort - 35,000 30yrs term" and "Marigold Model | Price package | Bank Loan | 5,120,000 | Monthly amort 31,000 for 30yrs". The team adds: "open for Pagibig, Bank and In House financing" and "heto po as of now ang available n pinaka lowest price sa scarlet model".

**Bloomfield total contract price.** "Bloomsfield model -8.9M  with 180 sqm lot area" (7-8 Sep 2026); "Bloomfield model price 9M | open for In house & Bank financing" (10 Aug 2026); "Bloomsfiled model | price package 8.6M" (15 Sep 2026).

**Britt / Hauslands Pampanga (15 Sep 2026 style):** "BRiTT | price package 5.5M", "ELLE Model | price package 5.361,000", "LANE MODEL | Price Package 4,391,520.00", "STAR model | Price package 5,600,000", "Open for In-house , Bank & Pag-IBIG Financing | Maximun term - 25yrs up to 30yrs". Construction: "estimated is 24 months po construction period"; units get "line up for batching of construction" once reserved.

**Non-Pag-IBIG member.** Standard button answer (28 Aug - 2 Sep 2026, also Apr 2026 and Jun 2026): "Yes, we can also offer In-House financing." One agent added (Jun 2026): "Pagibig members have the privilege to avail NO DOWNPAYMENT term. Please grab the opportunity and get your own dream house / But for non-pagibig member we can offer in-house financing with minimum 10% downpayment payable from 6-24 months." Another (Jan 2026): "Kung hindi po kayo Pagibig Member pwede parin po kayong kumuha ng bahay thru In-House financing."

**Site tripping / viewing.** Reused form (verbatim, 28 Aug - 2 Sep 2026 and earlier):

> Please leave your contact details and we will schedule you. | Full Name: | Contact Number: | Project Location: | Meet up Location: | Time: | Date:

Older variant (Jun 2026): "Please leave your contact details and we will schedule you for free site Tripping: ..." (same fields). Schedules stated, all conflicting (see section 4): daily 8am-5:30pm (28 Sep 2026), "from 7am - 6pm daily" (29 Sep 2026), 8-6pm daily (14-15 Sep 2026), 8am-6:30pm (Jun 2026), Monday-Sunday 8-6pm (Jun 2025). Agents follow with: "kailan po available date & time nyo?" / "just message us your available date & time" / "are you available this week or this weekend?". Agent also asked which property the customer wants before scheduling (2 Sep 2026). Open house invitation: "We're inviting you join Our open house tomorrow to witness and to view our model houses please feel free to message us! thanks / located at Duquit dau mabalacat near NLEX and Marquee mall" (24 Apr 2026).

**Pag-IBIG requirements.** Sent verbatim (30 Sep 2026, latest seen; also in an earlier internal thread):

> PAG- IBIG HOUSING LOAN REQUIREMENTS Basic Requirements: 1. 1x1 ID picture with signature at the back 4pc 2. TIN ID Card of TIN Number photocopy 1copy 3. Birth certificate photocopy 1copy 4. Certificate of NO Record of Marriage ( CENOMAR) if single 1copy 5. Marriage contract photocopy 1copy 6. Cedula Current year photocopy 1copy 7. Proof of billing address photocopy 1copy 8. MSVS- Membership Status Verification Slip - Orig and Photocopy w/ accomplished Pagibig Housing loan counseling questionnaire (PHLCG) & photocopy  of 2 valid  ids bearing picture of applicant  duly authenticated by HDMF (c/o fiesta)  9. 2 valid ids (principal buyer/spouse/spa or attorney-in-fact)  PRIVATE OFFICES A.  Latest payslip 1 month certified true copy 1 orig & 2 copies B. CEC- Certificate of employment and compensation 1 orig & 2 copies C. Latest 24 months HDMF contribution D. ITR or BIR Form 2316 2 copies

Short version at reservation (26 Apr 2026): "During reservation we can accept two valid IDs, payslip or proof of income. We will provide the list of others requirements same time."

**Step-by-step process (verbatim, conversation of 21 Sep 2026):**

> Step by Step Process | 1.  Mag site Tripping | 2. Magbayad ng reservation fee sa office or online | 3. Mag ayos ng requirements within 30 days | 4. After 30 days mag start ng magbayad ng installment ng processing/downpayment/equity(kung alin lang po meron or kasama sa babayaran) | 5. Move in date ( pagibig - once na tapos na po ang pagbayad ng processing, at equity isusubmit na kay pagibig at kapag approved na kay pagibig pwd na kayong makalipat) ( inhouse - once tapos na po ang bayad sa processing at naka 10% na sa downpayment pwd na kayong lumipat basta ready na yung bahay)

Alternate short version in an undated internal thread (list date 28 Sep 2026): "Step 1 po reservation | Step 2 1st payment of processing fee & equity (after 30days of reservation date) | Step 3 submittion of requirements 30days after reservation date) | Requirements: 1x1 pic (3pcs) | 2 valid ids (govt and local ids) | Birth and marriage cert PSA | Cenomar | Cedula | TIn id or tin num | BIR 2316 | Latest payslip | Cert of employment". Note the conflict: 4 pcs of 1x1 (Sep 30) vs 3 pcs (undated).

Fees before move-in (21 Sep 2026): "before turn over of house: clearance fee, fire extinguisher, home owners membership fee, more or less nasa 3,000"; the buyer applies for own electric and water installation; the team provides requirements. Pag-IBIG: "wla po dp sir pg under pagibig loan"; sequence "Reservation fee | processing fee then | monthly amortization upon approval".

**Unit photos.** Team sends "actual video" or "actual po yan mam" of models (Marigold, Scarlet; Sep 2026 and Jun 2026) or a Google Drive folder of photos / price sheets; sends PDF "available list" files: "THM-AVAILABLE-LIST-AS-OF-AUGUST-29-2026" and "PORAC 3 AVAILABLE AS OF SEPTEMBER 24, 2026 ON GOING UNITS" (names only, contents not read).

**Promo blurbs the team pastes (verbatim, 4 Sep 2026 conversation; also posted to Messenger):**

> Looking for your next home in Pampanga? Whether for personal use or investment, here are beautiful options located in prime communities, each with flexible financing and developer support!  | Bloomfield - Timog Residences (Angeles City) | 200 sqm lot • 4 Bedrooms • 3 Bathrooms • Single-Detached | Reservation: ₱50,000 | Financing: In-house / Bank | Scarlet - Mansfield Residences (Porac Pampanga) | 90 sqm • 3 Bedrooms • 2 Bathrooms • Duplex | Reservation: 30,000 | Financing: In-house / Bank / Pag-IBIG | Britt - Hauslands Pampanga (Mexico Pampanga) | 101 sqm • 3 Bedrooms • 1 Bathroom + 1 Powder Room | Reservation: ₱30,000 | Financing: In-house / Bank | Locations: Angeles City • Porac • Mexico Pampanga (we also have in other areas of Pampanga) | Message us today or call us at +63 932 424 4949 for viewing schedules or sample computations!

> FIND YOUR DREAM HOME AT MANSFIELD RESIDENCES! Choose the perfect home for your family: Russet Single Detached 110 sqm Floor Area 3 Bedrooms 3 Bathrooms 1 Powder Room 1 Carport | Marigold Single Attached 88 sqm Floor Area 3 Bedrooms 2 Bathrooms 1 Powder Room 1 Carport | Reservation Fee: ₱30,000 only | Open for Pag-IBIG Financing, Bank Financing, In-House Financing | Mansfield Residences, Angeles City, Pampanga | Near schools, malls, major establishments, and with 24/7 security for your peace of mind. Message us today or call us at +63 932 424 4949 for viewing schedules or sample computations!

> Discover Elevated Living at The Hauslands Clarkway! Located in Clark, Pampanga. ... Prime location near Clark Freeport Zone | Spacious and modern house designs | Secure, gated community | Close to schools, hospitals & commercial centers | Ideal for long-term investment and family growth | For inquiries and site viewing, contact: +63 932 424 4949 (Sun) / +63 976 229 0328 (Globe)

Team business contact numbers seen: +63 932 424 4949 (Sun), +63 976 229 0328 (Globe). Company named in one reply: Hausland Holdings Incorporated, office "Don bonifacio ave pulung mragul angeles city, near infinty, landers Marquee mall" (8 Jun 2026; used to redirect a financing company, not a buyer).

**Other typical answers (paraphrased).**
- Availability: "As of now po sold na" for Olongapo area (14 Sep 2026), The Hauslands Mabalacat (14 Sep 2026; "Ranging from 4M to 6M as of now is soldout" 26 Apr 2026), Dau Fiesta (29 Jun 2025), Mining Angeles (26 Apr 2026). Then redirect to Dapdap Mabalacat, San Fernando, Porac prime.
- Pag-IBIG approval: team said "as long as you provide the requirements you will be approved by Pag-IBIG" (21 Sep 2026). A bot must not repeat this as a guarantee (see section 5).
- Processing fee payment: 6 to 12 months depending on unit; can be installment or spot cash (21 Sep 2026); 90k processing fee payable in 6 months at 0% interest for the 2-storey (21 Sep 2026).

## 4. Everything the team stated: projects, models, prices, fees, terms

All dates are conversation last-activity dates (see section 1). "Latest seen" = newest figure for that item. Freshness: recent = latest mention within 30 days of 30 Sep 2026 (on or after 31 Aug 2026); older = earlier; once only = a single mention.

### 4a. Fiesta Communities (Pag-IBIG unless stated)

| Project | Location | Model | Bedrooms | Price | Reservation fee | Processing fee | Equity / downpayment | Monthly amounts | Loan term | Date(s) | Freshness |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Fiesta Communities Porac 3 | Porac | Kaya 2br | 2 | 1,200,000 | 5,000 | 130,000 (1yr: 11,666.67/month) | Equity 41,190.00 (1yr: 3,398.33/month); loan value 1,158,810.00 | Amort 7,600.94 | Term not stated in the template | 28-30 Sep 2026 (latest seen); "same steps at kaya homes, basic unit is 2storey, around 13k monthly" 21 Sep 2026 | recent |
| Fiesta Communities Porac 3 | Porac | LAYA Terreces 3BR (2-storey) | 3 | 2,800,000 (latest seen, 28-30 Sep 2026); 2.6M with amort 18k (21 Sep 2026, older figure) | 20,000 | 215,000 (1yr: 32,500/month) | Equity 0; loan value 2,800,000 | Amort 18,365.95 | 30 yrs; "estimated 15yrs term 23,000 per month" (30 Sep 2026) | 21-30 Sep 2026 | recent. CONFLICT: 2.6M vs 2.8M |
| Fiesta Communities Porac | Porac | Lowest bungalow basic | not stated | "990,0000" as typed (probably 990,000) | 5,000 | not stated for this unit | no equity or DP under Pag-IBIG | 6,400 per month | 30 yrs | 21 Sep 2026 | once only |
| Fiesta Communities Porac | Porac | 2-storey (price not given) | not stated | not stated | not stated | 90k payable 6 mos at 0% interest | not stated | 18k (Laya 3BR 2.6M) | not stated | 21 Sep 2026 | once only |
| Fiesta Communities Porac 3 | Porac | package "2.7M" | not stated | 2.7M | not stated | not stated | no DP under Pag-IBIG | Pag-IBIG monthly 17,000 | not stated | ~6 Jun 2026 | older, once only |
| Fiesta Communities Dapdap (FCI Dapdap) | Mabalacat | Kaya Terraces 2Br, lot 40.25 sqm | 2 | 1,375,000.00 | 10,000.00 | gross 135,000.00, net 125,000.00; 6,458.33/month for max 24 mos | none stated; est. loan 1,375,000.00 | Amort 9,018.99; required gross income 24,188.89 | not stated | ~May 2026 (inferred) | older, once only |
| Fiesta Porac 3 price sheet (internal thread, undated, list date 28 Sep 2026) | Porac | RH Basic (lot 45 sqm, floor 32 sqm) | not stated | Package 580,000 | 5,000 | 85,000 (80,000 after RF) | 6 mos at 0%: 13,333.33; 12 mos at 12%: 7,466.67; 24 mos at 14%: 4,133.33 | 30yrs 3,851.70 (GMI 10,338.42), 25yrs 4,104.27, 20yrs 4,515.00, 10yrs 6,782.20, 5yrs 11,547.69 | Pag-IBIG interest 6.378% | undated | once only |
| same sheet | Porac | RH Improve (45/32 sqm) | not stated | 775,000 | 5,000 | 100,000 | 6 mos 15,833.33; 12 mos 8,866.67; 24 mos 4,908.33 | 30yrs 5,146.62 (GMI 13,814.28) | 6.378% | undated | once only |
| same sheet | Porac | RH Improve End Unit (lot 60, floor 33 sqm) | not stated | 975,000 | 5,000 | 105,000 | 6 mos 16,666.67; 12 mos 9,333.33; 24 mos 5,166.67 | 30yrs 6,474.81 (GMI 17,379.23) | 6.378% | undated | once only |
| same sheet | Porac | Couple Bungalow 2br A (lot 70, floor 30.10) | 2 | 1,125,000 and also 1,100,000 (two versions in the sheet) | 10,000 | 115,000 | 6 mos 17,500; 12 mos 9,800; 24 mos 5,425 | 30yrs 7,470.91 (at 1.125M, typed "7,,470.91") / 7,304.92 (at 1.100M) | 6.378% | undated | once only. CONFLICT: two prices |
| same sheet | Porac | Couple Bungalow 3br A and B (lot 70, floor 40.5) | 3 | 1,225,000 and 1,200,000 (two versions) | 10,000 | 120,000 | 6 mos 18,333.33; 12 mos 10,266.67; 24 mos 5,683.33 | 30yrs 8,134.98 (1.225M) / 7,968.99 (1.200M) | 6.378% | undated | once only. CONFLICT: two prices |
| same sheet | Porac | Single Attached Bungalow A (lot 70, floor 40.5) | not stated | 1,325,000 and 1,300,000 | 10,000 | 125,000 | 6 mos 19,166.67; 12 mos 10,733.33; 24 mos 5,941.67 | 30yrs 8,799.05 (1.325M) / 8,633.05 (1.300M) | 6.378% | undated | once only. CONFLICT: two prices |
| same sheet | Porac | Couple 2 story 2br A (lot 70, floor 46.5) | 2 | 1,600,000 | reservation line garbled in source | 140,000 | not captured | 30yrs 10,625.27 (GMI 28,519.77) | 6.378% | undated | once only |
| same sheet | Porac | Couple 2 story 3br A (lot 70, floor 57) | 3 | 1,750,000 | 10,000 | 150,000 | 6 mos 23,333.33; 12 mos 13,066.67; 24 mos 7,233.33 | 30yrs 11,621.42 (GMI 31,193.49) | 6.378% | undated | once only |
| same sheet | Porac | Single Attached 2 story A (lot 70, floor 57) | not stated | 1,850,000 | 15,000 | 150,000 | 6 mos 22,500; 12 mos 12,600; 24 mos 6,975 | 30yrs 12,281.04 (GMI 32,975.98) | 6.378% | undated | once only |
| Fiesta (internal thread, undated, list date 28 Sep 2026) | not stated | Couple 2br 2storey | 2 | 1,650,000, discount 50,000, balance 1,600,000 | 10,000 | 130,000, 6,716.17/month for 2 yrs | not stated | Amort 10,494.83 | Pag-IBIG | undated | once only |
| same | not stated | Single detached | not stated | 2,250,000, discount 50,000, balance 2.2M | 15,000 | 140,000, 8,008.33/month for 24 mos | not stated | Amort 14,430.43 | Pag-IBIG | undated | once only |
| same | not stated | Couple bungalow | not stated | 1.250M, less 50k, balance 1.200M | 10,000 | 110k, 5,683.18/month for 24 mos | not stated | Amort 7,871.16 | Pag-IBIG | undated; also "Rowhouse basic: price 580,000, amort 3,304.41, processing 80,000 payable 2 yrs 4,133.33/month, reservation 5,000" | once only |
| same | not stated | Couple 2storey 3br (in-house) | 3 | 1,800,000, discount 50,000, balance 1,750,000 | 10,000 | 65,000, 6,066.67/month for 1 yr | 10% down 175,000 (29,166.67 for 6 mos) | principal balance 1,575,000, 23,132.04/month | 15 yrs | undated | once only |
| Fiesta (general ranges) | Porac, Mexico, Magalang, Mabalacat | various | | "850k up to 2M" (7 Sep 2026); "3M below" (7 Sep 2026); "low cost 850k-1.5M; mid '1-5M to 3M' (as typed); high end 4M up to 9M" (1 Jul 2025) | | | | Pag-IBIG monthly "starts 6k up to 15k" (7 Sep 2026); "3k up to 14k" (5 Sep 2026); "as low as 7k" (5 Sep 2026); standard reply "2,600 up to 20,000" (14 Sep 2026); "Price Range 2M up to 9M" (Dec 2025) | | see dates | latest seen for monthly range: 14 Sep 2026 (2,600-20,000), recent |

### 4b. Hauslands and Residences projects

| Project | Location (as said) | Model | Bedrooms | Price | Reservation fee | Other | Date(s) | Freshness |
|---|---|---|---|---|---|---|---|---|
| Mansfield Residences | Angeles City (Sto Domingo near SM Telabastagan / Friendship highway); the promo blurb says "Porac Pampanga" once. CONFLICT | Scarlet (duplex per blurb, 90 sqm) | 3 (2 bath) | 5M (8-29 Sep 2026, latest seen); 5.2M (10 Aug and 30 Aug 2026); 5.4M (~Dec 2025-Jan 2026, inferred); "4.8M up to 5.6M" for Mansfield (10 Aug 2026) | 30,000 | Pag-IBIG amort 26,000 for 30 yrs (Sep 2026); 24,000, 25 yrs max (older). Bank loan: 5.7M, amort 35,000, 30 yrs (12 Sep 2026) | 10 Aug - 29 Sep 2026 | recent. CONFLICT: 5M / 5.2M / 5.4M, newest 5M |
| Mansfield Residences | same | Marigold single attached, 88 sqm | 3 (2 bath, 1 powder, carport) | 4.7M (6 Jun 2026); bank-loan price 5,120,000, amort 31,000 for 30 yrs (12 Sep 2026) | 30,000 | | Jun and Sep 2026 | recent (bank figure). CONFLICT: 4.7M vs 5,120,000 |
| Mansfield Residences | same | Russet single detached, 110 sqm | 3 (3 bath, 1 powder, carport) | 6.2M (6 and 8 Jun 2026); 6.1M typed "6,1,000.00" (7 Jun 2026); 6.177M with amort 49,000 for 15 yrs at 10% down (6 Jun 2026) | 30,000 | 10% down payable 12-18 months; balance 15 yrs via bank or in-house | Jun 2026 | older. CONFLICT: 6.2M / 6.1M / 6.177M |
| Bloomfield, Timog Residences | Angeles City | Bloomfield, single detached, 4 BR, 3 bath | 4 | 8.6M (15 Sep 2026, latest seen); 8.9M (7-8 Sep 2026); 9M (10 Aug 2026) | 50,000 | lot 180 sqm (7-8 Sep) vs 200 sqm (blurb, 4 Sep). CONFLICT. In-house / bank only | Aug-Sep 2026 | recent. CONFLICT |
| Britt, The Hauslands Pampanga (Mexico, near NLEX Mexico exit; one agent said "Bulaon"; another said near Calulut San Fernando. Location wording conflicts) | Mexico Pampanga | Britt, 101 sqm | 3 (1 bath + 1 powder) | 5.5M | 30,000 | Max term 25 to 30 yrs; open for in-house, bank, Pag-IBIG per 14 Sep reply; blurb says in-house / bank. Construction est. 24 months | 14-15 Sep 2026 | recent |
| The Hauslands Pampanga | same | Elle | not stated | 5,361,000 | | | 14 Sep 2026 | recent, once only |
| The Hauslands Pampanga | same | Lane | not stated | 4,391,520.00 | | | 14 Sep 2026 | recent, once only |
| The Hauslands Pampanga | same | Star | not stated | 5,600,000 | | | 14 Sep 2026 | recent, once only |
| The Hauslands Pampanga | same | Belle (single detached) | not stated | not stated | | | 10 Aug 2026 | older, once only |
| The Hauslands Mabalacat | Mabalacat, beside Don Bosco, Duquit Dau | not stated | not stated | "starts 4.6M" (2 Sep 2026); "starts at 4M" (29 Jun 2025); "4M to 6M, sold out" (26 Apr 2026); "sold" (14 Sep 2026, latest seen) | | CONFLICT: available vs sold. Latest seen says sold | | recent |
| The Hauslands Clarkway | Clark | not stated | not stated | not stated | | promo blurb only | 4 Sep 2026 | recent, once only |
| Fiesta Communities Subic | Subic | Single attached 3 bedroom | 3 | not stated | | | 14 Sep 2026 | recent, once only |
| Low-rise condo | Angeles City | not stated | | not stated | | "we have low rise condo unit din po here in angeles city" | 14 Sep 2026 | recent, once only |

### 4c. Terms, schedules, and general facts

| Item | Figures stated, with dates | Freshness |
|---|---|---|
| Financing types | Pag-IBIG, bank, in-house; "maximum term of 15 & 30 yrs" (28 Sep 2026); "25yrs up to 30yrs" for Hauslands (14 Sep 2026) | recent |
| In-house down payment | "10% down payable 12-18 mos" (Jun 2026); "minimum 10% downpayment payable from 6-24 months" (Jun 2026); 10% down paid in 6 months example (undated) | older. CONFLICT 12-18 vs 6-24 months |
| Pag-IBIG down payment | "No downpayment" (Jun 2026, 21 Sep 2026) | recent |
| Processing fee payment | 6 to 12 months depending on unit (21 Sep 2026); 90k at 0% for 6 months (21 Sep 2026); 24 months in some sheets; 1 yr in Sep 28-30 sample | recent |
| Fees before move-in | about 3,000 total (clearance fee, fire extinguisher, HOA membership fee), buyer applies for own electric and water (21 Sep 2026) | once only |
| Site viewing hours | 7am-6pm daily (29 Sep 2026); 8am-5:30pm daily (28 Sep 2026); 8am-6pm every day (14-15 Sep 2026); 8am-6:30pm (6 Jun 2026); Monday-Sunday 8-6pm (29 Jun 2025) | recent. CONFLICT. Latest seen: 29 Sep 2026 says 7am-6pm; 28 Sep says 8am-5:30pm. Needs confirmation |
| Free tripping | "free site Tripping" (Jun 2026) | older, once only |
| Construction time for Hauslands | about 24 months (14 Sep 2026) | recent, once only |
| Single detached at Porac | exists, under construction, "mga year lang po mttapos" (21 Sep 2026) | once only |
| Ready-for-occupancy | not stated; "on going construction" (21 Sep 2026) | once only |
| Areas sold out | Mining Angeles (26 Apr 2026), Olongapo (14 Sep 2026), Dau Fiesta (29 Jun 2025), Hauslands Mabalacat (14 Sep 2026) | recent or older as dated |

### 4d. Time-limited, likely expired

- "We have ber months promo discount from 50k up to 150k" (about 6 Sep 2026). Likely valid only through the "ber" months; confirm.
- "Discount 50,000" shown on several Fiesta price lines (undated internal thread; list date 28 Sep 2026). Unknown whether still running.
- "Available list as of August 29, 2026" and "Porac 3 available as of September 24, 2026 on going units" (PDF names). Stock lists go stale.
- "hope u can avail soon paubos npo unit" (8 Jun 2026), unit scarcity claim, no quantity.
- "We're inviting you join Our open house tomorrow" (24 Apr 2026), event, expired.
- "Inviting you po site viewing this week are you available po?" (21 Sep 2026), week-based invitation.
- "Mag-start ng installment after 30 days of reservation" is a rule, not a promo, but any reservation deadline (30 days to submit requirements) should be confirmed.
- Sample computations dated 28-30 Sep 2026 depend on the Pag-IBIG rate (6.378% in the sheet) which changes.

## 5. Things the bot must not promise, and gaps

- Do not state Pag-IBIG approval as certain. A team member said "as long as you provide the requirements you will be approved by Pag-IBIG". The team did not answer whether the processing fee is refundable if the loan is not approved (21 Sep 2026): no answer given.
- Do not quote any price, fee, or term from section 4 as current. Prices for the same model differ by date (Scarlet 5M / 5.2M / 5.4M; Bloomfield 8.6M / 8.9M / 9M; Laya 2.6M / 2.8M; Russet 6.1M / 6.177M / 6.2M).
- Do not promise availability. Several projects were "sold" and then listed again under other names. Always say "I will confirm availability with our team".
- Do not promise site viewing times; schedules conflict. Ask for date and time and say the team will confirm.
- Do not offer discounts or promos without confirmation.
- Unanswered or incomplete in the inbox:
  - "Picture of unit?" (29 Sep 2026) and photo requests (8 Sep 2026): no photos sent in the visible reply.
  - Income qualification question (can a 26k basic income qualify, 5 Sep 2026): agent only asked for location and said "open pagibig financing".
  - Lot area and floor area of the Laya and Kaya models: asked 21 Sep 2026, not answered. (Sheet gives lot and floor area only for RH, Couple, and Single Attached models.)
  - Move-in timing (RFO after Pag-IBIG approval) answered only as "on going construction".
  - Request for "sample computation" for a bank loan on non-Mansfield units; "TCP?" for Fiesta (answered only as ranges).
  - Many customers who pressed "Can I book a tripping?" got only the contact-details form; completed forms contain personal data and should never be stored by the bot.
  - Several messages show "Message expired / This message is no longer available" (attachments), so some answers cannot be seen.
- Non-buyer inbound: a financing company asked about accreditation (8 Jun 2026); the team redirected them to the Hausland Holdings office. Bot should hand off non-buyer messages to a human.
- Internal agent text present in the inbox (e.g. messages addressed to "Ka-FIESTA" sellers and forms with seller or customer details) is internal; the bot must never quote it.

## 6. Tone and language notes

- Customers write mostly English (button texts), with Taglish and some Tagalog and Kapampangan (one thread). Many are short: a location word or "Pagibig member po?".
- Team replies: Taglish, short, lots of "po", "mam/sir", first-name address ("Hello Ms [name]"), "thank you", "see u soon". Some replies are curt English ("yes mam site viewing from 8-6pm"). Prices written as "5M", "850k", "1.5M", amortization as "18k". "Pagibig" is spelled many ways (Pagibig, Pag ibig, PAG- IBIG).
- Greeting patterns: automatic "Hi [name]! Please let us know how we can help you." Then the agent: "Good day po", "Hello po mam", "Hi ma'am thank once again for visiting us!", "Good morning!".
- Agent habit: after any price, ask a closing question: "would you like to set a site viewing schedule?" and "saan po kayo interested na location para masend ko po details?" and "Pag-IBIG member po?". The bot should do the same.
- Terms the team uses: tripping / site tripping, sched, equity, processing fee, reservation fee, monthly amort, GMI (gross monthly income), TCP (total contract price), RFO, inhouse, unit, model, "paubos na" (running out).
- Replies often split across several short messages; a bot should send one concise message instead.
- Business contact numbers appear at the end of promo blurbs: +63 932 424 4949 (Sun), +63 976 229 0328 (Globe).
