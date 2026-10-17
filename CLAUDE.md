# CLAUDE.md — C35 Freelancer Scope Change Desk

Context for Claude Code. Read this before doing anything in this repo.

## The situation

- **Event:** Fynd × NMIMS Hyderabad product and business simulation, a **24-hour hackathon**, 17–18 October 2026.
- **Case:** C35 Freelancer Scope Change Desk.
- **Repo:** https://github.com/Krishnass05/fynd (owner: Krishna, `Krishnass05`).
- **Team:** mixed engineering + MBA. Each teammate works on their **own branch named after them**; code reaches `main` only through pull requests. `main` should be protected.
- **Data is synthetic.** Never claim live revenue, real demand or production readiness.

## The problem (case brief)

- **User:** freelancer or small agency account lead.
- **Goal:** turn an ambiguous client change request into a clear scope, cost and approval decision.
- **Engineering build:** compare a request against agreed deliverables, identify changes, estimate effort with assumptions, create a versioned approval record.
- **Product change to negotiate (with MBA side):** add approval state and effort capacity *before* auto-quotes. Save the starting state, negotiated scope and final evidence.
- **Capabilities to show:** UI and state; data validation; tested business rules; CSV or JSON handling; readable evidence and a saved result; optional language/image/speech model **with a labelled fallback**.
- **Edge cases:** unclear request; urgent deadline; rework due to own defect; conflicting approvals.
- **Pilot framing:** workflow aid, not legal advice. Measure scope clarity and unapproved effort.
- **MBA side:** start with small agency owner, test per-seat subscription, price, cost-to-serve, first-customer path. Growth experiment: replay three scope requests with a client role player and record who, response, and what counts as a useful result. Business proof must separate **observed evidence** from **assumptions**.

## Engineering judging (100 points)

| Criterion | Pts |
| --- | --- |
| Working user journey (live end to end) | 25 |
| Case outcome checks, **demoed in printed order** | 25 (10 + 10 + 5) |
| Reliability and failure handling | 15 |
| Improvement after business feedback | 15 |
| Handoff and reproducibility (README, one command to run/test) | 10 |
| Individual technical contribution (own commits, can explain) | 10 |

Case outcome checks, in order:
1. (10) Six extra hours at ₹1000/hr = ₹6000 change estimate **before taxes**.
2. (10) A rejected change does not silently become committed work.
3. (5) Repeated import of the same request does not double-charge or double-book effort.

Business judging rubric: **not yet known** — ask organisers.

## Domain words (plain meaning)

- **Scope:** the fence around the job — what's included and what's excluded.
- **SOW:** the written agreement that sets the scope, price and deadline.
- **Scope creep:** small unpaid extra asks that pile up.
- **Change control / change order:** stop, check against scope, estimate, get approval, record it, then do the work.
- **Utilization rate:** billable hours ÷ available hours.

## Starter data: `fixture.json` (do not modify)

- Scope included: "one landing page", "contact form". Excluded: "payment checkout".
- Rate ₹1000/hr. Available hours: 10.
- R1 "Add payment checkout", 6h, pending → excluded item → a change, ₹6000.
- R2 "Fix our broken contact form", 2h, "defect rework" → our own bug, booked, ₹0.
- Rule from the data: **`null` means unknown, never zero.**

## What is built so far

> Correction: the notes originally said the engine was already done. It was not. It was built in this session, and `fixture.json` is reconstructed (see `_reconstructed`), not the organisers' file.

| File | Status |
| --- | --- |
| `scopeDesk.js` | Done: validation, scope classification, estimate, approval states, capacity gate, idempotent import, audit trail |
| `scopeDesk.test.js` | Done: 15 tests, all passing (`npm test`, Node 20+, no dependencies) |
| `fixture.json` | Starter data, unchanged |
| `package.json` | `npm test` runs `node --test` |
| `README.md` | Run instructions, rules, edge cases, gaps |

Design of `scopeDesk.js`:
- States: `needs_clarification`, `quoted`, `approved`, `rejected`, `defect_rework`. `reopen(id, by, reason)` goes back to `quoted`.
- Committed hours count only `approved` + `defect_rework`; committed value counts only `approved`.
- Import is keyed by id + SHA-256 content hash: same content → ignored and logged; changed content → new version, old approval voided.
- Approve throws `ConflictError` if rejected, not quoted, or over remaining capacity. Reject throws if approved or rework.
- Bad input throws `ValidationError`.
- Every action is written to `audit` with a version number; `snapshot()` returns full state.

## Still to build (priority order)

1. **UI** for the full journey: load fixture/JSON → see each request classified → estimate → approve/reject → saved record and audit trail. Keep rules in `scopeDesk.js`; the UI only calls them.
2. **Demo flow for the 3 checks in printed order** (buttons or a scripted panel).
3. **Failure handling in the UI:** bad JSON, missing fields, negative hours, unclear request, conflicting approval — clear messages, no crashes.
4. **v1 → v2 for "improvement after business feedback":** v1 without the approval + capacity gate before quotes; v2 with it. Tag `v1-before-feedback` and `v2-after-feedback`.
5. **Save/export:** JSON and CSV export of the snapshot and audit trail.
6. **Urgent deadline:** rush multiplier (labelled as an assumption) and capacity warning.
7. **Optional:** LLM that parses free-text requests into line items, with a clearly labelled manual fallback. Never commit API keys; use `.env` + `.gitignore`.

## Working rules

- Run `npm test` before every commit; never leave tests failing.
- Don't modify `fixture.json`.
- Small, clear commits under the teammate's own git identity.
- Merge to `main` via PR every 2–4 hours. Feature freeze at hour 20.
- Keep the README current as features land.
- Keep `decision.md` and `flow.md` (repo root) current. When a decision is made or changed, add a row to `decision.md` the same day (never delete rows; mark them replaced). When behaviour changes, update the matching diagram in `flow.md` and say so in the pull request.

## Team documents (shared, outside the repo)

- Kickoff plan: https://claude.ai/code/artifact/a0f833f5-89a3-4474-8065-0b500a23f04a
- Git guide for teammates: https://claude.ai/code/artifact/d80a2302-7a93-40d4-ad5c-fcada8cb272d
