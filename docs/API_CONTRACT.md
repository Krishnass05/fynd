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
| `listDemoUsers` | `GET /api/users` | anyone | `User[]` |
| `getMe` | `GET /api/me` | any user | `User` |
| `updateMe` | `PUT /api/me` `{name?, skills?}` | any user | `User` |
| `listJobs` | `GET /api/jobs?mine=1&status=open` | client (mine) or freelancer (open jobs) | `Job[]` |
| `createJob` | `POST /api/jobs` `{title, description, budget, deadline}` | client | `Job` |
| `getJob` | `GET /api/jobs/:id` | owner client, or freelancer | `JobDetail` (client sees all applicants, freelancer only their own) |
| `applyToJob` | `POST /api/jobs/:id/applications` `{pitch, proposedPrice}` | freelancer | `Application` (409 if already applied or job not open) |
| `acceptApplication` | `POST /api/applications/:id/accept` | owner client | `{ projectId }` (closes the job, rejects other applicants, creates the project) |
| `listProjects` | `GET /api/projects` | participant | `Project[]` |
| `getProject` | `GET /api/projects/:id` | participant | `ProjectDetail` (SOW versions, change requests, totals, audit) |
| `listMessages` | `GET /api/projects/:id/messages` | participant | `Message[]` |
| `sendMessage` | `POST /api/projects/:id/messages` `{body}` | participant | `Message` |
| `uploadSow` | `POST /api/projects/:id/sow` `{kind, filename, text}` | freelancer uploads `baseline`; client uploads `amendment` | `UploadSowResult` |
| `approveChange` | `POST /api/projects/:id/changes/:changeId/approve` | client | `ProjectDetail` |
| `rejectChange` | `POST /api/projects/:id/changes/:changeId/reject` `{reason}` | client | `ProjectDetail` |
| `reopenChange` | `POST /api/projects/:id/changes/:changeId/reopen` `{reason}` | either | `ProjectDetail` (reason required) |
| `runCaseChecks` | `GET /api/demo` | anyone | `DemoResult` (the 3 checks, in printed order) |
| `resetData` | `POST /api/reset` | anyone (demos and tests) | `{ ok: true }` |

## SOW upload (current limits)

- Only `.txt` and `.md` files for now (PDF reading comes later). The browser reads the file and sends its text.
- The reader looks for headings **Deliverables**, **Included** and **Excluded**, then bullet lines. Hours are read from text like `(6 hours)` or `6h`. A `Rate: Rs 1000/hr` line sets the project rate.
- Uploading the same text again returns the existing version. It never creates a second version and never charges twice.
- Compare labels: `new`, `previously_excluded`, `changed`, `removed`, `unchanged`. New, previously excluded and changed items become priced change requests.

## Change request states

`needs_clarification`, `quoted`, `approved`, `rejected`, `defect_rework`, `in_scope`. Only `quoted` can be approved. A `rejected` change is never counted as committed. It can only come back through `reopen`.
