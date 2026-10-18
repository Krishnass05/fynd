# Scope flow: SOW intake, negotiation, tasks, check-ins and new requests

Status: **agreed problem statement, not built yet** (2026-10-18). Decision D-76. Diagram: `flow.md` section 11.

## The problem in one line

A client and a freelancer must agree, in writing and before any work, on what is included, what it costs and when it is due, and every later ask must go through the same agreement, so no work is unpaid and no charge is unapproved.

## Rules that hold everywhere

1. **Nothing is committed until both sides agree.** A task joins the work list, the hours and the price only when the *other* side accepts the latest offer. A declined or rejected item never becomes committed work (judged check 2).
2. **Price = hours x rate, before tax.** 6 extra hours at Rs 1000/hr = Rs 6000 (judged check 1). A rush fee is a labelled assumption.
3. **The same request twice is one request** (judged check 3): same project and same text means the existing request is shown, not a new one.
4. **Unknown is not zero.** Hours not yet given show "unknown, no price yet", never Rs 0.
5. **Every step is recorded** (who, what, when, version) and can be exported.
6. Workflow aid, not legal advice. Synthetic data.

## Negotiation (one mechanism, used in three places)

An **offer** has: hours, rate (or a fixed price), due date, and a note. On the other side's latest offer you can:

| Action | Result |
| --- | --- |
| **Accept** | Agreed. The agreed hours, price and date are locked and become the record. |
| **Counter** | A new offer goes to the other side. The full history stays visible. |
| **Decline** (with reason) | Closed. Nothing is committed. |

Only the side that did **not** make the latest offer can accept it, so nobody agrees with themselves. Used for:

1. **Hiring.** The freelancer applies with a price. The client can hire at that price, counter, or decline; the freelancer can accept or counter back. Hiring happens at the agreed price.
2. **The SOW.** The freelancer can counter on single rows (hours, date) before signing off.
3. **Each new task** asked for later.

## 1. SOW intake: the client uploads, the freelancer signs off

1. The client uploads the SOW (PDF, TXT or MD).
2. Crewmate reads it into a table: **Deliverable · Included/Excluded · Hours · Price · Due · Done when**.
   - Our rules read it first. If a Gemini key is set, the AI tidies messy documents; its rows are marked *read by AI, please check*. Without a key, or if the AI fails, the rules version is used and labelled.
   - Rows the reader is unsure about are flagged; unknown hours stay unknown.
3. The freelancer reviews row by row: **Accept**, **Counter** (hours or date), or **Query** (a question to the client).
4. **Approve SOW** locks it as *Signed scope v1*. **Send back** returns it to the client with reasons.
5. Every included row becomes a **task**. The milestones (payment stages) stay; each task belongs to one milestone.

## 2. Work, progress and daily check-ins

- Task states: **To do -> In progress -> Done** (freelancer marks) **-> Approved** (client confirms). The client can send a Done task back with a reason.
- **Progress bar = approved hours / all agreed hours.** A 10-hour task counts more than a 1-hour task. Tasks with unknown hours are listed but not counted, and the bar says so.
- A **milestone is ready** when all its tasks are approved; the client then approves the milestone as today (record only, no money moves).
- **Daily check-in** (freelancer, once a day): what I did, hours spent, tasks moved, blockers. The client sees a warning after **2 days** without one. A check-in never changes the price.

## 3. A new task in plain English (client side)

1. The client writes the ask in plain English, for example *"Can you also add a blog page with 3 posts?"*, and can mark it urgent.
2. Crewmate compares it with the signed scope and suggests a label:
   - **Already included** (no charge)
   - **New, or excluded in the SOW** (a paid change)
   - **Fix of our own defect** (rework, no charge, hours still booked)
   - **Unclear** (needs details first, no price)
   The AI does this when a key is set, with the rules as the labelled fallback. The suggestion is only a suggestion.
3. The freelancer answers: **Accept as included**, **Quote** (hours, price, date), **Ask for details**, or **Decline** with a reason.
4. A quote opens a negotiation (counter until accepted or declined).
5. Only when agreed does the task join the work list, the hours, the price total and the progress bar.
6. If the agreed hours exceed the hours left, accepting is blocked until a new date or more capacity is agreed.

## Edge cases from the case brief

| Case | Behaviour |
| --- | --- |
| Unclear request | Labelled unclear; no price until details are given. |
| Urgent deadline | Rush fee shown as an assumption; capacity warning. |
| Rework of our own defect | No charge; hours still count against capacity. |
| Conflicting approvals | Only the side that did not make the latest offer can accept; a declined item cannot be accepted later without a new offer. |

## Who builds what (from docs/OWNERSHIP.md)

| Part | Owner |
| --- | --- |
| Rules engine, negotiation, tasks, check-ins, API, SOW table component, freelancer pages | Krishna |
| Client project page (tasks, progress, new-task box, check-in view) | Harini |
| Client job page (hire with negotiation), shared UI parts | Sanjana |
| Demo script and business proof (three requests replayed with a client role player) | Swapnil |

## Build order (proposed)

1. Negotiation engine + tests (offers, accept, counter, decline, history, who may accept).
2. New task in plain English, end to end (classification, quote, negotiation, commit) — this is what the three judged checks run on.
3. Tasks, progress bar, daily check-ins.
4. SOW intake table with freelancer sign-off.
5. Negotiation at hiring.
