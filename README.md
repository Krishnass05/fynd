# C35 Scope Change Desk

Fynd x NMIMS Hyderabad hackathon, 17-18 Oct 2026. A client posts a job, a freelancer applies, they chat in a project workspace and share a signed SOW. When the client later uploads an amended SOW, the site compares the two, prices each extra item before tax, flags anything unusual, and records the client's decision. All data is synthetic. It is a workflow aid, not legal advice.

## Run and test

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # rules engine tests
npm run build   # type check and production build
npm run smoke   # end-to-end API test (start the app first)
```

Needs Node 20+. Data is held in server memory and resets on restart. Supabase replaces it before the live deploy.

## How it fits together

| Part | Where | Notes |
| --- | --- | --- |
| Rules engine (money, approvals, capacity, audit) | `lib/engine/` | Plain JavaScript with tests. Every price and decision comes from here |
| SOW reader and comparison | `lib/engine/sow.js` | Reads .txt and .md for now |
| API | `app/api/**`, `lib/server/` | Contract in [docs/API_CONTRACT.md](docs/API_CONTRACT.md) |
| Client pages | `app/(client)/` | Jobs, applicants, project page, change orders |
| Freelancer pages | `app/(freelancer)/` | Find jobs, apply, profile, project workspace |
| Shared parts | `components/` | UI kit, chat, change list, SOW upload |
| Case checks | `/demo` page and `lib/engine/demo.js` | The 3 outcome checks in printed order |

## Rules the engine enforces

| Rule | Behaviour |
| --- | --- |
| `null` hours | Unknown, never zero. No price until clarified |
| Excluded item in the signed SOW | A paid change, hours x rate, before tax |
| Defect rework (our own bug) | Booked as effort, charged 0 |
| Urgent | 1.5x rush multiplier, labelled as an assumption |
| Approve | Only from quoted, refused if rejected, already approved or over capacity |
| Reject | Never counted as committed. Can return only through reopen with a reason |
| Import | Same id and content is ignored, so no double charge or double booking |

## Demo

A 6-minute walkthrough with sample SOW files is in [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

## For teammates

Read [TEAM_GUIDE.md](TEAM_GUIDE.md) for setup and the branch rules, and [docs/OWNERSHIP.md](docs/OWNERSHIP.md) for who edits what. Statements of Work go in [docs/sow](docs/sow/README.md).

## Data note

`fixture.json` is **reconstructed** from the case brief (flagged by `"_reconstructed": true`). It is not the organisers' original file. Swap in the official one if you get it. It seeds the first project so the three case checks are visible straight away.

## Not built yet

PDF reading, anomaly flags beyond the first few, Supabase storage and the live deploy, the final design, v1/v2 tags for the business-feedback improvement, optional language model reader with a labelled manual fallback.
