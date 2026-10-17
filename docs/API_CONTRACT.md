# API contract

**Owner: Krishna.** Pages never call `fetch` directly. They use the functions in [`lib/api.ts`](../lib/api.ts), which call these endpoints. Types are in [`lib/types.ts`](../lib/types.ts). If you need a change here, message Krishna. Do not edit these files yourself.

## Basics

- All bodies and replies are JSON.
- Every request sends the header `x-demo-user: <user id>` (set for you by `lib/api.ts` after "Continue as ..." on the start page).
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
| `getFreelancer` | `GET /api/freelancers/:id` | client | `FreelancerProfile` (overview, skills, rate, rating, jobs, projects on this site). 404 if the id is not a freelancer |
| `listSaved` | `GET /api/saved` | client | `Freelancer[]` (the client's saved freelancers) |
| `setSaved` | `PUT /api/saved/:id` `{saved: true or false}` | client | `{ saved }` (404 if the id is not a freelancer). Freelancers in search results and profiles carry `saved` for the viewing client |
| `getSiteStats` | `GET /api/stats` | anyone, no sign-in | `SiteStats`: real counts for the landing page (job profiles, sample freelancers, case checks passing) |
| `login` | `POST /api/login` `{email, password, role}` | anyone, no sign-in | `User`. 400 for a missing or malformed field, 403 for a wrong password or the wrong account type. Demo accounts only: client@demo.test, freelancer@demo.test, freelancer2@demo.test, shared password in the login page |
| `getMe` | `GET /api/me` | any user | `User` |
| `updateMe` | `PUT /api/me` `{name?, skills?, headline?, overview?, location?, ratePerHour?}` | any user (the profile fields are for freelancers) | `User`. `ratePerHour` is whole rupees above 0 |
| `listJobs` | `GET /api/jobs?mine=1&status=open` | client (mine) or freelancer (open jobs) | `Job[]` |
| `createJob` | `POST /api/jobs` `{title, description, budget, deadline, profileId?}` | client | `Job`. With a `profileId`, accepting an applicant sets the project rate and hours from that profile |
| `getJob` | `GET /api/jobs/:id` | owner client, or freelancer | `JobDetail`: the job, `typicalTotal` (library price, or null) and applicants with their skills (client sees all, freelancer only their own) |
| `applyToJob` | `POST /api/jobs/:id/applications` `{pitch, proposedPrice}` | freelancer | `Application` (409 if already applied or job not open) |
| `acceptApplication` | `POST /api/applications/:id/accept` `{milestones?: [{title, amount}]}` | owner client | `{ projectId }` (closes the job, rejects other applicants, creates the project and its milestones). The milestones must be whole rupees and add up to the applicant's price exactly, or the call is refused and nothing changes. Left out, the price is split 30/40/30 |
| `listProjects` | `GET /api/projects` | participant | `Project[]` |
| `getProject` | `GET /api/projects/:id` | participant | `ProjectDetail` (SOW versions, change requests, totals, audit) |
| `listMessages` | `GET /api/projects/:id/messages` | participant | `Message[]` |
| `sendMessage` | `POST /api/projects/:id/messages` `{body}` | participant | `Message`. Before saving, the server replaces email addresses and phone numbers (10 or more digits) with `***REDACTED***` and sets `redacted: true`. Prices, hours and dates are not touched. 400 for an empty message |
| `uploadSow` | `POST /api/projects/:id/sow` `{kind, filename, text}` | freelancer uploads `baseline`; client uploads `amendment` | `UploadSowResult` |
| `approveChange` | `POST /api/projects/:id/changes/:changeId/approve` | client | `ProjectDetail` |
| `rejectChange` | `POST /api/projects/:id/changes/:changeId/reject` `{reason}` | client | `ProjectDetail` |
| `reopenChange` | `POST /api/projects/:id/changes/:changeId/reopen` `{reason}` | either | `ProjectDetail` (reason required) |
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
