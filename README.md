# C35 Freelancer Scope Change Desk

Fynd x NMIMS Hyderabad hackathon, 17-18 Oct 2026. A workflow aid that turns a vague client change request into a scope decision, a cost estimate and an approval record. It is not legal advice. All data is synthetic.

## Run and test

```bash
npm start   # http://localhost:3000
npm test    # 21 tests
```

Needs Node 20+. No dependencies. The UI (`public/`) only calls the rules engine through a small server (`server.js`). Each change is saved to `data/latest.json` (ignored by git) and can be exported as JSON or CSV from the page. The saved file is a record for evidence; it is not reloaded on restart.

## For teammates

Read [TEAM_GUIDE.md](TEAM_GUIDE.md) for setup, the branch rules and how to send work to `main`. Statements of Work go in [docs/sow](docs/sow/README.md).

## Data note

`fixture.json` is **reconstructed** from the case brief (flagged by `"_reconstructed": true`). It is not the organisers' original file. Swap in the official one if you get it.

## Rules (all in `scopeDesk.js`)

| Rule | Behaviour |
| --- | --- |
| `null` hours | Unknown, never zero. Request needs clarification and has no estimate. |
| Excluded item | Classified as a change, quoted at `hours x rate`, before taxes. |
| Included item | In scope, no charge, but the hours use capacity. |
| Defect rework | Our own bug: hours booked, charge 0. |
| No scope match | Needs clarification. |
| Urgent | 1.5x rush multiplier, labelled as an assumption. |
| Approve | Only from `quoted`; refused if rejected, already approved, or hours exceed remaining capacity. |
| Reject | Only from `quoted` or `needs_clarification`. Never counted as committed. |
| Reopen | Rejected goes back to `quoted`; needs a name and a reason. |
| Import | Keyed by id + SHA-256 of content. Same content is ignored and logged. Changed content makes a new version and voids the old approval. |
| Validation | Whole batch checked first; one bad row imports nothing. |

Committed hours = approved + defect rework + in scope. Committed value = approved only.

Every action is written to the audit trail with a sequence number and version. `desk.snapshot()` returns the full state as plain JSON.

## The three case checks

Tests in `scopeDesk.test.js` are named `check 1`, `check 2`, `check 3`, in the printed order:

1. 6 extra hours at 1000/hr = 6000 before taxes
2. A rejected change does not become committed work
3. Re-importing the same request does not double-charge or double-book

## Not built yet

v1/v2 tags for the business-feedback improvement, optional language model with a labelled manual fallback, reloading saved state on restart.
