# Crewmate

**Live site: https://crewmate-sable.vercel.app**

Fynd x NMIMS Hyderabad hackathon, 17-18 Oct 2026. A client posts a job, a freelancer applies, they chat in a project workspace and share a signed SOW. When the client later uploads an amended SOW, the site compares the two, prices each extra item before tax, flags anything unusual, and records the client's decision. All data is synthetic. It is a workflow aid, not legal advice.

**Live site: https://crewmate-sable.vercel.app**

Fynd × NMIMS Hyderabad hackathon, 17–18 October 2026, case **C35: Scope Change Desk**. All data is synthetic. Crewmate is a workflow aid, not legal advice, and no money moves through the site.

---

## The problem

A client hires a freelancer for a job. Then the small extra asks start: "can you also add a payment page?", "one more change?". Nobody prices them, so the freelancer either works for free or argues, and there is no written record of what was agreed. This is **scope creep**.

## What Crewmate does

1. **Hire.** The client posts a job; freelancers apply with a price; the client compares them side by side and hires one, splitting the price into milestones.
2. **Agree the scope.** The client uploads the SOW (statement of work). Crewmate reads it into a table: item, included or excluded, hours, price. The freelancer fills in hours and approves; if hours changed, the client confirms. Now there is a signed scope.
3. **Price every new request.** The client asks for something new in plain English. Crewmate checks it against the signed scope (included, excluded, new, own defect, unclear). The freelancer accepts it as included, fixes it free, quotes, asks for details, or declines. A quote is negotiated with counter offers until one side accepts. Only then is it committed work.
4. **Track the work.** Signed rows and agreed requests become tasks. The freelancer posts a daily check-in (the client is warned after 2 days without one). The client approves finished tasks; the progress bar counts approved hours; milestones become ready when their tasks are approved.
5. **Keep it on the platform.** Chat and voice/video calls hide phone numbers, emails, links and handles, even when spelled out in words or sent one digit at a time.

## Try it

| | |
| --- | --- |
| Live site | https://crewmate-sable.vercel.app |
| Demo client | `client@demo.test` / `demo1234` |
| Demo freelancer | `freelancer@demo.test` / `demo1234` |
| Both sides in one account | `both@demo.test` / `demo1234` |
| The three case checks | https://crewmate-sable.vercel.app/demo |
| Pricing | https://crewmate-sable.vercel.app/pricing |
| Sample SOW to upload | [public/sample-sow.txt](public/sample-sow.txt) |

You can also register a real account (email and password, or Google sign-in).

## The three judged checks

| # | Check | How Crewmate guarantees it | Tested in |
| --- | --- | --- | --- |
| 1 | Six extra hours at ₹1000/hr = **₹6000** change estimate before taxes | Price = hours × rate (× 1.5 rush, labelled an assumption), always "before tax" | `scopeDesk.test.js`, `negotiation.test.js`, smoke test, `/demo` |
| 2 | A **rejected change does not silently become committed** work | Only approved change orders and agreed negotiations count; declined ones are closed and cannot be accepted later; only the side that did not make the latest offer can accept it | same |
| 3 | Repeated import of the same request **does not double-charge or double-book** | Requests keyed by id + SHA-256 content hash; the same SOW text or the same request returns the existing one | same |

Other rules: unknown hours are `null`, never zero (no price until clarified); approvals are refused over the project's remaining hours; own-defect fixes are free but still use hours.

## Features

- **Public site:** home page (search, categories, how it works, featured talent, pricing), pricing page, About, Contact, Help for clients and freelancers, Terms & Conditions, one footer on every page.
- **Accounts:** register and log in with server-side validation, Google sign-in, sessions, lockout after 5 wrong passwords, one account with both client and freelancer sides.
- **Client:** find freelancers (search, categories, skills, rate), profiles with past work and reviews, saved list, post a job (optionally from a library of 28 job profiles), compare applicants, hire with a milestone split, dashboard, in-app pricing page.
- **Freelancer:** find jobs, apply, edit profile, see client company profiles, dashboard.
- **Project workspace (both sides):** SOW sign-off table with a format guide and sample; plain-English requests with negotiation; task list with progress by approved hours; daily check-ins; milestones; change orders from amended SOWs; chat with the contact guard; voice and video calls with live captions; help assistant.

## Tech stack

| Layer | What | Where |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, plain CSS / CSS Modules | `app/`, `components/` |
| API | Next.js API routes (serverless functions on Vercel) | `app/api/**` |
| Server logic | Permissions and wiring | `lib/server/service.ts` |
| Rules engine | Plain JavaScript, no dependencies, unit tested | `lib/engine/*.js` |
| Database | Supabase (Postgres) | `supabase/schema.sql`, `lib/server/persist.ts` |
| Auth | scrypt password hashes, HMAC-signed HTTP-only cookie, Google OAuth | `lib/server/auth.ts`, `session.ts`, `google.ts` |
| AI | Google Gemini as a second check after the rules (chat, calls, help); rules decide if it is off or slow | `lib/engine/aiguard.js`, `aihelp.js` |
| Calls | WebRTC + Web Speech API (captions) | `components/call/Call.tsx` |
| Hosting | Vercel (production branch `krishna`) | — |
| Tests | node:test (92 unit tests) + end-to-end smoke test | `lib/engine/*.test.js`, `scripts/smoke.mjs` |

### How a request flows

```
Browser page → lib/api.ts (fetch, JSON)
  → app/api/**/route.ts → run() in lib/server/http.ts
  → lib/server/service.ts (who may do what)
  → lib/engine/*.js (the rules)
  → lib/server/persist.ts → Supabase
  → JSON back to the page
```

The browser never talks to Supabase directly and never holds a database key.

### Database

Two tables, created by [supabase/schema.sql](supabase/schema.sql), with row level security on and no policies (only the server key can read them):

- **`app_state`**: one row (`id = 'main'`) holding the whole app state as versioned JSON: users and password hashes, jobs, applications, projects, milestones, SOW documents, messages, change orders, task requests, negotiations, task progress and check-ins. Every write is "update where version = n" with a retry, so two people saving at once never overwrite each other. This is a deliberate hackathon shortcut: simple and safe for a pilot, but it will not scale to many users; the next step is one table per entity.
- **`call_signals`**: short-lived call set-up messages.

An uploaded SOW file is **not** stored: the browser sends its text, the server reads it into rows (item, included or excluded, hours) and saves those rows plus a SHA-256 hash of the text (for duplicate detection).

Without Supabase keys the app keeps everything in memory (development); it resets on restart.

## Run it locally

Needs **Node 20+**.

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm test           # 92 rules-engine unit tests
npm run build      # type check and production build
npm run smoke      # end-to-end API test against a running server (it resets the data: never point it at the live site)
```

Copy `.env.example` to `.env.local` (never commit it) and fill in what you need:

| Variable | Needed for | Secret |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase storage (leave empty for in-memory data) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase storage (server only) | **Yes** |
| `SESSION_SECRET` | Signing the login cookie (set a long random value when deployed) | **Yes** |
| `APP_URL` | The live address, for the Google redirect | No |
| `GEMINI_API_KEY` | The AI second check and help assistant (optional) | **Yes** |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in (optional) | **Yes** |
| `STORE=memory` | Force in-memory data even with Supabase keys | No |
| `ALLOW_RESET=true` | Allow `/api/reset` in production (keep it off on the live site) | No |

## Deploy

Pushing to the `krishna` branch deploys to Vercel automatically (about 2 minutes). `https://crewmate-sable.vercel.app/api/version` shows which commit is live. Full Vercel + Supabase + Google steps: [docs/DEPLOY.md](docs/DEPLOY.md).

## Project layout

```
app/                 pages (one folder per URL) and app/api/** (API routes)
  (client)/client/   signed-in client pages
  (freelancer)/      signed-in freelancer pages
components/          shared parts: shell, footer, landing, sow, tasks, work, chat, call, pricing, ui
lib/engine/          the rules (plain JS) and their tests
lib/server/          service layer, auth, sessions, Supabase persistence
lib/api.ts           the only way pages talk to the server
lib/pricing.ts       plans and prices (shared by every pricing view)
lib/site.ts          footer and About page content (team, social links)
supabase/schema.sql  the database tables
scripts/             smoke test and setup checks
docs/                guides (below)
```

## Documentation

| Document | What is in it |
| --- | --- |
| [docs/Crewmate-Technical-Handbook.pdf](docs/Crewmate-Technical-Handbook.pdf) | Everything technical: every page, button, API route, the database schema, deployment, glossary |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | Every API endpoint, its input and output |
| [docs/SCOPE_FLOW.md](docs/SCOPE_FLOW.md) | The SOW, negotiation, tasks and check-in design |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Vercel + Supabase deployment, step by step |
| [docs/AUTH.md](docs/AUTH.md) | Accounts, sessions and Google sign-in |
| [docs/VIVA.md](docs/VIVA.md) | Viva preparation |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Demo walkthrough |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Colours, type, motion, accessibility |
| [decision.md](decision.md) | Why each choice was made (one row per decision) |
| [flow.md](flow.md) | Diagrams of the journeys and states |

## Team and workflow

Each teammate works on their own branch and code reaches `main` only through pull requests. Who edits what: [docs/OWNERSHIP.md](docs/OWNERSHIP.md). Setup and branch rules: [TEAM_GUIDE.md](TEAM_GUIDE.md). Run `npm test` and `npm run build` before every pull request.

## Data note

`fixture.json` is **reconstructed** from the case brief (flagged `"_reconstructed": true`), not the organisers' original file. It seeds demo project P1 so the three case checks are visible straight away.

## Known limits

- All app data is one JSON row: fine for a demo and pilot, not for many users.
- SOW files: `.txt` and `.md` only (no PDF), and the original file is not kept.
- No email yet (verification, password reset, notifications); the contact form does not send.
- Negotiation at hiring is not built: the client hires at the applicant's price.
- Pricing plans are proposals being tested; no payment is taken. Features marked "Coming soon" on the pricing page are not built.
- Calls may need a TURN server on strict networks.
- Founding-team names and photos, and social links, are placeholders until supplied.
