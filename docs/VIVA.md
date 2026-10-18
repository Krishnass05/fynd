# Viva prep: Scope Change Desk (C35)

Written 18 October 2026. All data is synthetic. Read this once, then keep the demo order in front of you.

## 1. The 30-second pitch

> Freelancers lose money to scope creep: the client asks for "one small thing" and nobody agrees what it costs. **Scope Change Desk** is a freelance job board plus a project workspace. A client posts a job, freelancers apply, the client hires and splits the price into milestones. The freelancer uploads the signed SOW. When the client later sends an amended SOW, the site **compares the two documents, prices every new item (hours x rate, before tax), flags anything unclear, and records the client's decision**. A rejected change never becomes committed work, and the same document can never be charged twice. It is a workflow aid, not legal advice.

## 2. The three scored checks (say them in this order)

| # | Check | What to show | Where |
| --- | --- | --- | --- |
| 1 (10 pts) | 6 extra hours at Rs 1000/hr = **Rs 6,000 before tax** | The "Payment checkout" change order, priced 6h x 1000 | Open `/demo`, check 1. Also on the client profile dashboard |
| 2 (10 pts) | A **rejected** change does not silently become committed work | Reject one change; committed hours and value do not move | `/demo` check 2; freelancer dashboard shows it is not counted |
| 3 (5 pts) | **Repeat import** does not double-charge or double-book | Upload the same amended SOW twice; nothing changes | `/demo` check 3; project page |

Backup proof if the screen fails: run `npm test` (23 tests pass) and `npm run smoke` (full journey through the API passes).

## 3. Live demo order (about 6 minutes)

Before the judges arrive: stop and restart `npm run dev` so the data is clean. Use two windows, the second one private. Sample files are in `docs/demo/`.

1. **Home and login.** Open http://localhost:3000 (the CraftHire home page). Show the hero search and the category carousel, then click **Log in** (top right) to reach the start page, click "Log in as client", press **Fill in** on Demo Client, log in. Say: demo accounts only, real sign-up comes with Supabase.
2. **Client home.** Big search, popular searches, review carousel (labelled sample reviews). Open the **Services** menu to show the domains and topics. Open **Jobs** to show My jobs and Post a job.
3. **Hire.** Jobs > My jobs > "Logo for a new cafe". Show two applicants side by side. Accept Second Freelancer with the 30/40/30 milestone split (record only, no money moves).
4. **Freelancer window.** Log in as Second Freelancer, open the project, upload `signed-sow.txt`. This is the baseline.
5. **Client asks for more.** Client window: upload `amended-sow.txt`. The site compares them. Brand guidelines was excluded: 6h x Rs 1000 = **Rs 6,000**. Menu design has no hours, so it is **not priced** (unknown is never zero).
6. **Decide.** Approve one change, reject another with a reason.
7. **Freelancer dashboard.** Approved value, capacity used, the rejected item not counted.
8. **No double charge.** Upload `amended-sow.txt` again. Nothing changes.
9. **Profile.** Click the DC avatar: profile details with the client dashboard underneath.
10. **`/demo`.** The three checks run in printed order and pass.

## 4. Marks map (engineering, 100 points)

| Criterion | Pts | Our evidence |
| --- | --- | --- |
| Working user journey, live end to end | 25 | Steps 1 to 10 above. Two roles, real API, one flow from job to approved change |
| Case outcome checks in printed order | 25 | `/demo`, `npm test`, `npm run smoke` |
| Reliability and failure handling | 15 | Clear errors for bad login, bad JSON, missing fields, negative hours, wrong role, conflicting approval, over capacity. No crashes. Unknown hours stay unpriced |
| Improvement after business feedback | 15 | Approval state and effort capacity come **before** quotes (the product change in the brief). **Gap: the v1/v2 git tags are not made yet. See section 7** |
| Handoff and reproducibility | 10 | README, `npm test`, `npm run smoke`, `npm run dev`, API contract, design system, decision log, flow diagrams |
| Individual technical contribution | 10 | Each person explains their own commits (`git shortlog -sn`) |

## 5. How it works (be ready to draw this)

- **Front end:** Next.js 16 + React 19 + TypeScript, plain CSS. Pages never call `fetch`; they use `lib/api.ts`.
- **API:** Next.js routes in `app/api/`, one wrapper turns every failure into `{error, type}` with 400/403/404/409.
- **Service layer:** `lib/server/service.ts` holds the operations. Roles are checked here, not in the page.
- **Rules engine:** `lib/engine/` is plain JavaScript with no dependencies. UI only calls it. 23 tests.
- **Data:** in-memory store behind one file (`lib/server/store.ts`). Replacing it with Supabase changes that file and the service layer, not the pages.
- **Rules to quote:** `null` means unknown, never zero. Committed hours count only approved + defect rework; committed value counts only approved. Import is keyed by id + SHA-256 of the content: same content is ignored and logged, changed content makes a new version and voids the old approval. Approve throws if rejected, not quoted, or over remaining capacity.

## 6. Likely questions and honest answers

**Technical**

- *Why no database?* The store sits behind one file. We chose Vercel + Supabase for the live link; it is not wired yet. Today it is in memory and resets on restart.
- *How do you stop double charging?* The SOW text is hashed (SHA-256). A repeat upload returns the existing version; nothing is priced again.
- *What if hours are missing?* The item is flagged "needs clarification" and not priced. We never guess zero.
- *Is the contact guard an AI?* No: it is a rule-based guard (lib/engine/guard.js, tested) that catches numbers and emails even when written or said in words. The Help assistant is also rule-based. Neither calls a language model; a model could be added behind the same functions. Say this plainly.
- *Do the calls work?* Voice and video calls use WebRTC with live captions checked by the guard; they need Chrome or Edge and microphone permission, and the live part has only been tested through the server, so run a real call on two machines first.
- *Is login secure?* No. It is a demo login with a shared password to show the two roles. Real accounts come with Supabase Auth. We do not store passwords.
- *What reads the SOW?* A rule-based reader for `.txt` and `.md` (headings, rate lines, "(6 hours)"). PDF reading is not built. There is **no language model**, so there is no model fallback to show.
- *How are milestones handled?* Record only, whole rupees, must add up exactly to the price, default 30/40/30. No money moves.
- *How do you handle an urgent request or our own defect?* Defect rework is booked at Rs 0 and counts toward hours. **A rush multiplier for urgent deadlines is not built.**
- *Conflicting approvals?* Approve fails with a conflict if the change was rejected, is not quoted, or is over capacity.

**Business**

- *Who pays?* Hypothesis, not proof: the freelancer or small agency account lead, per seat. The MBA team tests this. Keep **observed** (what role players said) separate from **assumed**.
- *Is this real traffic or revenue?* No. All data and the sample reviews are synthetic.
- *Is this legal advice?* No. It is a workflow aid; approvals here are not a signed contract.

## 7. Known gaps (say them before they are found)

1. **No live deploy yet** (Vercel + Supabase not set up). Run it locally for the viva.
2. **`main` is behind `krishna`.** Pull requests #3 and #4 are not merged. Merge them before the viva or demo from the `krishna` branch.
3. **v1/v2 tags missing** (`v1-before-feedback`, `v2-after-feedback`). Without them the "improvement after feedback" mark is hard to show. Make them or explain the change from the commit history.
4. No PDF reading, no rush multiplier, no JSON/CSV export button, no language-model reader.
5. Sample freelancers' ratings and review text are made up and labelled.
6. Brand colours were changed several times by request; the final one is white page, charcoal text, orange buttons.

## 8. Ten-minute checklist before the judges

- [ ] `git checkout krishna && git pull`, then `npm install`
- [ ] `npm test` shows 23 passing
- [ ] `npm run dev`, open http://localhost:3000, then `npm run smoke` in a second terminal
- [ ] Restart `npm run dev` after the smoke test so the demo data is clean
- [ ] Two windows ready, second one private; `docs/demo/*.txt` easy to find
- [ ] Know the three checks by number, and which of your commits you wrote
- [ ] Phone charged as a backup; screenshots of `/demo` saved in case Wi-Fi or the server fails
