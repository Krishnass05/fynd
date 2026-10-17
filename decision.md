# Decisions

Every choice that shapes the project, with the reason, so anyone can answer "why did we do it this way?". Newest at the bottom of each section. **Owner: Krishna.** When you make or change a decision, add a row the same day. Do not delete old rows; mark them *Replaced by D-nn*.

Status: **Done** (built), **Planned** (agreed, not built), **Open** (still to decide).

## Product and scope

| ID | Date | Decision | Why | Status |
| --- | --- | --- | --- | --- |
| D-01 | 2026-10-17 | The product is a change-order layer: compare a signed SOW with an amended SOW, price the extra items, and record the client's decision | This is the case (C35) and the USP | Done |
| D-02 | 2026-10-17 | Add a **basic** job board: client posts a job, freelancer applies, client accepts, they chat in a project workspace, then the SOW flow starts | Requested by Krishna (Fiverr and Zoho style). Kept basic so it does not crowd out the scored checks | Done (starter pages) |
| D-03 | 2026-10-17 | Out of scope: advanced marketplace features (ranking, reviews, escrow, disputes, video calls), real payments, e-signature, legal advice, trained ML, scanned PDFs | 24 hours. The three case checks matter most | Done |
| D-04 | 2026-10-17 | "Charge" means a priced change order plus an approval record, not collecting money | All data is synthetic. No real payment is needed for the case | Done |
| D-05 | 2026-10-17 | Anomaly detection is explainable rules, each flag showing its reason. No trained model | Data is synthetic, so a "model" would be faked. Judges can check a rule | Planned (3 flags built, more to add) |
| D-06 | 2026-10-17 | Demo sign-in is a role switch (Continue as Client / Freelancer), not real accounts | Real auth costs hours and scores nothing. Supabase Auth only if time remains after the freeze | Done |
| D-07 | 2026-10-17 | `null` hours mean unknown, never zero. Unknown items get no price | Rule from the case data | Done |
| D-08 | 2026-10-17 | The three case checks come first, shown in printed order on `/demo`: 6h x 1000 = 6000 before tax; a rejected change is never committed; a repeat import never double-charges | 25 of 100 engineering points | Done |
| D-09 | 2026-10-17 | The first job of the MBA side is to ask the organisers for the business rubric. All business claims are tagged Observed or Assumed | Rubric is unknown. Evidence must be honest | Open |

## Technology

| ID | Date | Decision | Why | Status |
| --- | --- | --- | --- | --- |
| D-10 | 2026-10-17 | The rules engine is plain JavaScript in `lib/engine`, tested with Node's built-in runner, no dependencies | Money logic stays explainable and testable, and runs anywhere | Done (23 tests) |
| D-11 | 2026-10-17 | `fixture.json` was reconstructed from the brief and is flagged `_reconstructed`. Swap in the official file if we get it | We never had the organisers' file | Done |
| D-12 | 2026-10-17 | Stack: Next.js (React, TypeScript) on Vercel, Supabase Postgres | Krishna's choice (most familiar). One project for pages and API, one deploy for a live link. Replaced the earlier plain Node prototype | Done (Next.js). Supabase Planned |
| D-13 | 2026-10-17 | The engine stays separate from the web layer. Pages only call `lib/api.ts` | A UI change must not be able to change the money logic | Done |
| D-14 | 2026-10-17 | Data lives in memory behind `lib/server/store.ts` for now (resets on restart) | Let the team build before the database exists | Done. Replaced when D-15 lands |
| D-15 | 2026-10-17 | Database plan: store each action (import, approve, reject, reopen) as a row in an append-only events table and rebuild a project by replaying them. A unique sequence number per project blocks double-booking | The engine holds state in memory and cannot be saved directly. The events table doubles as the audit trail | Planned |
| D-16 | 2026-10-17 | The service layer must become asynchronous for the database. API endpoints and types stay the same | Teammates' pages are unaffected | Planned |
| D-17 | 2026-10-17 | The SOW comparison decides if an item is a paid change and passes `classifyAs` to the engine, which prices it | A genuinely new item matches neither the included nor the excluded list, so text matching alone cannot tell | Done |
| D-18 | 2026-10-17 | Uploading the same SOW text twice returns the existing version (SHA-256 of the text) and re-imports are ignored by id plus content hash | Case check 3: no double charge | Done |
| D-19 | 2026-10-17 | SOW upload accepts `.txt` and `.md` only for now. PDF reading comes later | Needs a library and has accuracy limits. The team's SOWs are written as markdown | Planned |
| D-20 | 2026-10-17 | The reader understands the team template (`Included deliverables`, `Excluded (needs a change order)`, `Rate per hour`). A person reviews what it extracted | The first reader read nothing from Harini's 15 SOWs. Fixed and tested | Done |
| D-21 | 2026-10-17 | The repo is public. No keys, no `.env.local`, no real client data. Supabase service key lives only in Vercel settings | Public repo | Done (rule) |
| D-22 | 2026-10-17 | A live link needs a real database. A free hosting server sleeps, so open the link a few minutes before presenting | Serverless memory is not shared between requests | Planned |

## Design

| ID | Date | Decision | Why | Status |
| --- | --- | --- | --- | --- |
| D-23 | 2026-10-17 | Look: green, cream and white, Fraunces headings, Manrope text, pill buttons, taken from the Crafthire Lovable design. The ui-ux-pro-max tool suggested a blue palette instead; we kept green | The team picked the Crafthire design. Switching later is a token change | Done |
| D-24 | 2026-10-17 | Accessibility first: text contrast at least 4.5 to 1, form field borders 3 to 1 (`--line-strong`), skip link, global reduced-motion rule, SVG icons (no emoji) | Rules from ui-ux-pro-max, checked with a script | Done |
| D-25 | 2026-10-17 | Motion: at most two animated things per screen. React Bits components used: BlurText, CountUp, SpotlightCard, PillNav. We skipped GSAP-based and WebGL ones | Weight, battery and the one-or-two rule | Done |
| D-26 | 2026-10-17 | The shared `Card` is the pastel card from the reference picture (pill label, icon, facts, progress bar, footer with a dark button). `JobCard` and `ProjectCard` are ready-made versions | Requested by Krishna | Done |
| D-27 | 2026-10-17 | One navigation bar everywhere: PillNav via `AppNav`, links from `lib/nav.ts` | Requested by Krishna. A second nav is not allowed | Done |
| D-33 | 2026-10-17 | Every page must work on a 375px phone: no sideways scroll (long words break), buttons and inputs at least 44px tall, navigation folds into a menu. Checked by measuring overflow and touch targets on all pages | Requested by Krishna. Judges and the MBA team will open it on phones | Done |
| D-34 | 2026-10-18 | Client-side requirements are extended with 20 items (FR31 to FR50) from what Upwork shows hiring clients (public home and Hire pages). Build first: client dashboard summary, SOW-library categories, pricing insight, proposal compare, milestones. Team seats and real escrow stay out of scope | Requested by Krishna. Items that tie to the SOW library and change orders strengthen the USP. Logged-in Upwork screens were not seen, so unseen items are marked as our own ideas | Planned |
| D-35 | 2026-10-18 | Krishna approved the two items D-03 had put out of scope: reviews (FR47) and a simulated protected-payment ledger (FR43), as small clearly labelled versions | Request on 2026-10-18. They stay Could until the Should items are done | Planned |
| D-36 | 2026-10-18 | The SOW library is a snapshot file (`lib/data/sowLibrary.json`): 28 profiles from Harini's 15 SOWs and the rate and budget lines of Sanjana's PDF. A job started from a profile gives the project that profile's rate and hours | Gives FR35 and FR41 real numbers. Refresh the file as more SOWs are written. Figures are illustrative | Done |
| D-37 | 2026-10-18 | Proposals are compared in a table that scrolls inside its own box on phones, with lowest price marked and each price shown against the job budget and the library price | FR38. Prices are the main thing a client compares | Done |

## Team and process

| ID | Date | Decision | Why | Status |
| --- | --- | --- | --- | --- |
| D-28 | 2026-10-17 | Each person works only on their own branch and only in their own folders (see `docs/OWNERSHIP.md`). Krishna merges pull requests | Avoids merge conflicts | Done. Harini merged PR #2 herself once; reminded |
| D-29 | 2026-10-17 | Three layers: Frontend (Sanjana, Harini, Krishna), Backend (Krishna), Database (Krishna) | Clear owners per layer | Done |
| D-30 | 2026-10-17 | 54 SOW profiles after merging six near-duplicates. Ranges: Harini 01-15, Sanjana 16-30, Swapnil 31-45, Krishna 46-54 | The brief asked for about 50. Merging avoids two prices for one job | Done (assignments). Writing in progress |
| D-31 | 2026-10-17 | SOW files stay on their authors' branches, not `main`. Krishna reads them from there | Krishna's request | Done |
| D-32 | 2026-10-17 | Feature freeze at hour 20. Merge to `main` every 2 to 4 hours | From the brief | Done (rule) |

## Open decisions

| ID | Question | Needed from |
| --- | --- | --- |
| O-1 | What does the business judging rubric reward? | Organisers, via the MBA team |
| O-2 | Who owns the MBA work (price test, cost to serve, first customer, replays)? | Krishna |
| O-3 | Real sign-in, or keep the role switch for the demo? | Krishna |
| O-4 | Chat live or refresh-based? (refresh every few seconds today) | Krishna |
| O-5 | Show a labelled test-mode payment screen, or end at the approved change order? | Krishna |
| O-6 | Which PDF text library? | Krishna, when PDF reading is built |
| O-7 | Is the official `fixture.json` available? | Organisers |
