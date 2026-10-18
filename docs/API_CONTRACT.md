# API contract

**Owner: Krishna.** Pages never call `fetch` directly. They use the functions in [`lib/api.ts`](../lib/api.ts), which call these endpoints. Types are in [`lib/types.ts`](../lib/types.ts). If you need a change here, message Krishna. Do not edit these files yourself.

## Basics

- All bodies and replies are JSON.
- Real accounts are recognised by their signed `cd_session` cookie (see docs/AUTH.md). The header `x-demo-user` is only believed for the synthetic demo accounts. Every request sends the header `x-demo-user: <user id>` (set for you by `lib/api.ts` after "Continue as ..." on the start page).
- An account that has both sides (`roles` on the user, for example both@demo.test) also sends `x-demo-role: client` or `freelancer`. The server treats the account as that role for the request; an account without that side keeps its own role. `/api/me` returns the role it is acting as, plus `roles`.
- Money is whole rupees, always before tax. **Unknown hours are `null`, never `0`.**
- Errors: HTTP status 400, 403, 404, 409 or 500 with `{ "error": "message safe to show", "type": "validation | forbidden | not_found | conflict | server" }`. Show `error` to the user as it is.
- Data is in server memory for now and resets on restart (`POST /api/reset` resets it on purpose). It moves to Supabase later. The endpoints and types do not change.

## Demo users (seed data)

| id | name | role |
| --- | --- | --- |
| `u_client1` | Demo Client | client |
| `u_freelancer1` | Demo Freelancer | freelancer |
| `u_freelancer2` | Second Freelancer | freelancer |

Seed project `P1` (client1 and freelancer1) already has a signed SOW and the two case requests, so the change-order screens have data on day one.

## Endpoints

| Function in `lib/api.ts` | Method and path | Who | Returns |
| --- | --- | --- | --- |
| `listDemoUsers` | `GET /api/users` | anyone | `User[]` (only the three demo logins; the other sample freelancers are for browsing) |
| `searchFreelancers` | `GET /api/freelancers?q=&category=&skill=&maxRate=&available=1` | client | `FreelancerSearch`: matching freelancers (best rated first) plus the category and skill options for the filters. Sample data |
| `getFreelancer` | `GET /api/freelancers/:id` | client | `FreelancerProfile` (overview, skills, rate, rating, jobs, projects on this site). 404 if the id is not a freelancer | Now open to any signed-in user, and it includes `portfolio` (previous work), `workedWith` (past clients), `reviews` and `reviewCount`; `rating` is the average of the reviews (sample content).
| `listSaved` | `GET /api/saved` | client | `Freelancer[]` (the client's saved freelancers) |
| `setSaved` | `PUT /api/saved/:id` `{saved: true or false}` | client | `{ saved }` (404 if the id is not a freelancer). Freelancers in search results and profiles carry `saved` for the viewing client |
| `getSiteStats` | `GET /api/stats` | anyone, no sign-in | `SiteStats`: real counts for the landing page (job profiles, sample freelancers, case checks passing) |
| `login` |  `POST /api/login` `{email, password, role}` | anyone, no sign-in | `User`. 400 for a missing or malformed field, 403 for a wrong password or the wrong account type. Demo accounts only: client@demo.test, freelancer@demo.test, freelancer2@demo.test, shared password in the login page |
| `getClient` | `GET /api/clients/:id` | any signed-in user | `ClientProfile`: company details, rating and reviews (sample), counts from real data (jobs posted, hires, open jobs) and the open jobs. Only the client themself gets their email. 404 if the id is not a client |
| `startCall` | `POST /api/projects/:id/call` `{mode: 'voice' or 'video'}` | project member | `CallSignal` (a ring to the other person) |
| `pollCallSignals` | `GET /api/projects/:id/call/signals?since=N` | project member | `CallSignal[]` addressed to you after number N (ring, offer, answer, ice, hangup, reject, caption) |
| `sendCallSignal` | `POST /api/projects/:id/call/signal` `{type, payload}` | project member | `CallSignal`. Types: offer, answer, ice, hangup, reject. Captions can only be sent through the guard below |
| `sendCaption` | `POST /api/projects/:id/call/caption` `{text}` | project member | `{blocked, reasons}`. The contact guard checks the line: a clean line goes to the other person as a caption; a line with a phone number (also said in words), email, link or handle sends them a hangup (reason guard) and puts a note in the chat. 400 for empty text |
| `askHelp` | `POST /api/help` `{question, role?}` | anyone | `{ text, links, topics, source }`. `source` is `ai` when a model wrote the reply from the site guide, `rules` for the keyword answer. 400 for an empty or over-300-character question. Limited to 20 AI answers a minute site-wide |
| `register` | `POST /api/auth/register` `{name, email, password, confirmPassword, accountType, acceptedTerms}` | anyone | `User`, and a signed `cd_session` cookie. 400 with `fields` (a message per field) for anything invalid or an email already used. Passwords are stored hashed and never returned |
| `login` | `POST /api/login` `{email, password, role}` | anyone | `User` (acting as `role`). Real accounts get the `cd_session` cookie. 400 with `fields` for a badly filled form, 403 for a wrong password, unknown email or wrong side (same message for the first two), 429 after 5 wrong passwords (locked 10 minutes) |
| `addRole` | `POST /api/auth/add-role` `{role}` | signed-in real account | `User` with both `roles`, acting as the new side. 400 for a role that is not client or freelancer, 409 if the account already has it, 403 for a demo account or when not signed in |
| `logout` | `POST /api/auth/logout` | anyone | `{ ok }`, and clears the cookie |
| `getAuthConfig` | `GET /api/auth/config` | anyone | `{ google }`: whether Google sign-in is switched on |
| Google | `GET /api/auth/google/start?mode=login or register&type=client, freelancer or both&next=/path`, then `GET /api/auth/google/callback` | anyone | Redirects to Google and back, then to `/auth/done`. Errors come back to the page as `?google=state, denied, unverified or not_configured` |
| `getAiStatus` | `GET /api/ai-status` | anyone | `{ enabled, provider }`: whether the AI second check on chat and calls is on (a key is set) and which provider. Never returns the key |
| `getMe` | `GET /api/me` | any user | `User` |
| `updateMe` | `PUT /api/me` `{name?, skills?, headline?, overview?, location?, ratePerHour?}` | any user (the profile fields are for freelancers) | `User`. `ratePerHour` is whole rupees above 0 |
| `listJobs` | `GET /api/jobs?mine=1&status=open` | client (mine) or freelancer (open jobs) | `Job[]` |
| `createJob` | `POST /api/jobs` `{title, description, budget, deadline, profileId?}` | client | `Job`. With a `profileId`, accepting an applicant sets the project rate and hours from that profile |
| `getJob` |  `GET /api/jobs/:id` | owner client, or freelancer | `JobDetail`: the job, `typicalTotal` (library price, or null) and applicants with their skills (client sees all, freelancer only their own) |
| `applyToJob` | `POST /api/jobs/:id/applications` `{pitch, proposedPrice}` | freelancer | `Application` (409 if already applied or job not open) |
| `rejectApplication` | `POST /api/applications/:id/reject` | owner client | `{ id, status: 'rejected' }`. Removes a pending applicant; the job stays open. 409 if the application was already decided, 403 for anyone but the job's client |
| `acceptApplication` | `POST /api/applications/:id/accept` `{milestones?: [{title, amount}]}` | owner client | `{ projectId }` (closes the job, rejects other applicants, creates the project and its milestones). The milestones must be whole rupees and add up to the applicant's price exactly, or the call is refused and nothing changes. Left out, the price is split 30/40/30 |
| `listProjects` | `GET /api/projects` | participant | `Project[]` |
| `getProject` | `GET /api/projects/:id` | participant | `ProjectDetail` (SOW versions, change requests, totals, audit) |
| `listMessages` | `GET /api/projects/:id/messages` | participant | `Message[]` |
| `sendMessage` | `POST /api/projects/:id/messages` `{body}` | participant | `Message`. Before saving, the contact guard replaces phone numbers (written, or said in words), email addresses (written or said as 'at ... dot ...'), links and handles with `***REDACTED***`, and sets `redacted: true` and `hiddenKinds`. Asking to move off the platform sets `warning`. Prices, hours and dates are not touched. 400 for an empty message |
| `uploadSow` | `POST /api/projects/:id/sow` `{kind, filename, text}` | client (both kinds) | `UploadSowResult`. A `baseline` (the first SOW) starts as `status: proposed` and is not the scope until signed; a new upload replaces an unsigned one; 409 once signed. An `amendment` needs a signed baseline (409 otherwise) |
| `reviewSow` | `POST /api/projects/:id/sow/:docId` `{action, ...}` | freelancer: `approve {rows?: [{hours, note?}]}` or `send_back {note}`; client: `confirm` or `send_back {note}` | `ProjectDetail`. Approving with no hours changed signs it; changed or filled-in hours go to the client (`awaiting_client`), who confirms (signed, hours written into the items, the SOW's `Rate:` becomes the project rate) or sends them back (`proposed`). Baselines without a `status` (older data) count as signed |
| `approveChange` | `POST /api/projects/:id/changes/:changeId/approve` | client | `ProjectDetail` |
| `rejectChange` | `POST /api/projects/:id/changes/:changeId/reject` `{reason}` | client | `ProjectDetail` |
| `reopenChange` | `POST /api/projects/:id/changes/:changeId/reopen` `{reason}` | either | `ProjectDetail` (reason required) |
| `listTasks` | `GET /api/projects/:id/tasks` | participant | `TaskRequest[]` (new tasks asked for in plain English, each with its `negotiation`) |
| `askForTask` | `POST /api/projects/:id/tasks` `{text, urgent?}` | client | `{ task, created, project }`. The rules suggest a label against the signed scope (`included`, `excluded`, `new`, `defect`, `unclear`). The same text again (ignoring case, spaces and punctuation) while the first is not declined returns the first with `created: false`: nothing is added twice |
| `actOnTask` | `POST /api/projects/:id/tasks/:taskId` `{action, ...}` | see below | `ProjectDetail`. Freelancer first answer: `included`, `defect {hours}` (no charge, hours booked), `quote {offer}`, `ask {note}`, `decline {note}`. Client: `details {text}` after `ask`, `decline {note}` to withdraw. Either side during a quote: `counter {offer}`, `accept`, `decline {note}`. An offer is `{hours, ratePerHour?, rush?, due?, note?}` (rate defaults to the project rate; rush defaults on for an urgent request) or `{price, hours?, due?, note?}`. Only the side that did not make the latest offer can accept; unknown hours cannot be accepted; accepting more hours than are left is refused (409). Agreed tasks count in `totals` (`totals.tasks`) |
| `moveWork` / `setWorkMilestone` | `POST /api/projects/:id/work/:key` `{action: 'move', to, note?}` or `{action: 'milestone', milestoneId}` | freelancer: start, done, milestone; client: approve, send back (note required) | `ProjectDetail`. `ProjectDetail.work` lists the tasks (signed SOW included rows, agreed requests, own-defect fixes, already-included asks; key like `sow:S1:0` or `task:T12`), `progress` is approved hours / known hours, and the last task of a milestone being approved marks the milestone ready |
| `addCheckin` | `POST /api/projects/:id/checkins` `{did, hours, blockers?, moved?: [{key, to}]}` | freelancer | `ProjectDetail` (`checkins`, `checkinStatus`). One a day (India time, 409 after that); hours 0 to 24; a bad move refuses the whole check-in. The client is warned after 2 days without one |
| `getClientDashboard` | `GET /api/client-dashboard` | client | `ClientDashboard` (stats, things needing attention, projects with capacity and counts, jobs with applicant counts, and `activity`: the last 8 real events on the client's jobs and projects, newest first) |
| `getLibrary` | `GET /api/library` | any user | `LibraryResponse` (28 job profiles with typical rate, hours, deliverables and exclusions; illustrative) |
| `markMilestoneReady` | `POST /api/projects/:id/milestones/:milestoneId/ready` | freelancer | `ProjectDetail` (pending becomes ready, 409 otherwise) |
| `approveMilestone` | `POST /api/projects/:id/milestones/:milestoneId/approve` | client | `ProjectDetail` (409 if already approved). `ProjectDetail` now has `milestones` and `milestoneSummary`. Record only: no money moves |
| `getFreelancerDashboard` | `GET /api/dashboard` | freelancer | `FreelancerDashboard` (stats, projects with capacity and counts, things needing attention, applications, up to 3 open jobs) |
| `runCaseChecks` | `GET /api/demo` | anyone | `DemoResult` (the 3 checks, in printed order) |
| `resetData` | `POST /api/reset` | anyone (demos and tests) | `{ ok: true }` |

## SOW upload (current limits)

- Only `.txt` and `.md` files for now (PDF reading comes later). The browser reads the file and sends its text.
- The reader looks for headings **Deliverables**, **Included** and **Excluded**, then bullet lines. Hours are read from text like `(6 hours)` or `6h`. A `Rate: Rs 1000/hr` line sets the project rate.
- Uploading the same text again returns the existing version. It never creates a second version and never charges twice.
- Compare labels: `new`, `previously_excluded`, `changed`, `removed`, `unchanged`. New, previously excluded and changed items become priced change requests.

## Change request states

`needs_clarification`, `quoted`, `approved`, `rejected`, `defect_rework`, `in_scope`. Only `quoted` can be approved. A `rejected` change is never counted as committed. It can only come back through `reopen`.
