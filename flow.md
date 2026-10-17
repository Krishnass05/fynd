# Flows

How things move through the product and through the team. Diagrams are Mermaid, which GitHub draws automatically. **Owner: Krishna.** Update a flow whenever the behaviour changes, and say so in the pull request.

## 1. The user journey

```mermaid
flowchart TD
  A[Client posts a job, optionally from a library profile that fills scope, rate and hours] --> B[Freelancers apply; client compares proposals side by side]
  B --> C{Client accepts one}
  C -->|accept, after splitting the price into milestones| D[Job becomes in progress, project workspace opens, others are rejected]
  D --> E[Client and freelancer chat in the workspace]
  D --> F[Freelancer uploads the signed SOW, the baseline]
  F --> G[Reader extracts deliverables, exclusions, rate, hours]
  G --> H[Client later uploads an amended SOW]
  H --> I[Site compares it with the signed SOW]
  I --> J[Each extra item is priced: hours x rate, before tax, with flags]
  J --> K{Client decides}
  K -->|approve| L[Committed hours and value, audit entry]
  K -->|reject| M[Recorded, never committed. Can be reopened with a reason]
  M -->|reopen| J
```

## 2. How an amended SOW becomes change orders

```mermaid
flowchart LR
  U[Upload text] --> V{Valid file and items found?}
  V -->|no| X[Clear error, nothing saved]
  V -->|yes| W{Same text as an existing version?}
  W -->|yes| Y[Reuse that version, re-import is ignored]
  W -->|no| Z[Save new version]
  Z --> P[Parse sections and hours]
  P --> Q[Compare each item with the signed SOW]
  Q --> R1[new]
  Q --> R2[previously excluded]
  Q --> R3[changed: extra hours only]
  Q --> R4[unchanged or removed: no charge]
  R1 --> S[Import as change requests, classifyAs change]
  R2 --> S
  R3 --> S
  S --> T[Engine prices, adds flags, state becomes quoted or needs clarification]
```

Rules: unknown hours stay `null` and get no price. A rush request uses the 1.5 multiplier, labelled as an assumption. An item over remaining capacity cannot be approved.

## 3. Change request states

```mermaid
stateDiagram-v2
  [*] --> needs_clarification: hours unknown or unclear
  [*] --> quoted: priced change
  [*] --> defect_rework: our own defect, charged 0
  [*] --> in_scope: inside the agreement, charged 0
  needs_clarification --> quoted: re-import with hours
  needs_clarification --> rejected: reject
  quoted --> approved: client approves, capacity allows
  quoted --> rejected: client rejects
  rejected --> quoted: reopen with a reason
  approved --> quoted: changed content imported, approval voided
```

Committed hours = approved + defect rework + in scope. Committed value = approved only.

## 4. A request through the system

```mermaid
sequenceDiagram
  participant P as Page
  participant A as lib/api.ts
  participant R as app/api route
  participant S as lib/server/service
  participant E as lib/engine
  participant D as store (memory now, Supabase later)
  P->>A: call a function, never fetch directly
  A->>R: HTTP with x-demo-user header
  R->>S: parsed body and the acting user
  S->>S: role and ownership checks
  S->>E: rules, pricing, approval
  E-->>S: result or a validation or conflict error
  S->>D: read and write
  S-->>R: result
  R-->>A: JSON, or { error, type } with 400, 403, 404, 409
  A-->>P: data, or an Error with a message safe to show
```

## 5. Data layout (planned database)

```mermaid
flowchart LR
  users --> jobs
  jobs --> applications
  jobs --> projects
  projects --> sow_documents
  sow_documents --> sow_items
  projects --> messages
  projects --> desk_events[desk_events: append-only, replayed to rebuild a project]
```

`desk_events` is the audit trail too. A unique sequence number per project stops two people from booking at once.

## 6. How the team ships

```mermaid
flowchart LR
  B[Own branch: krishna, sanjana, harini, swapnil] --> T[npm test and npm run build pass]
  T --> PR[Pull request to main]
  PR --> M[Krishna reviews and merges]
  M --> P[Everyone: git pull origin main]
  M --> V[Vercel deploys, planned]
```

Folders are owned by one person each (`docs/OWNERSHIP.md`). SOW files stay on their authors' branches.

## 7. Layers

| Layer | Where | Who |
| --- | --- | --- |
| Frontend | `app/`, `components/` | Sanjana, Harini, Krishna |
| Backend | `lib/engine`, `lib/server`, `app/api` | Krishna |
| Database | `lib/server/store.ts` today, Supabase planned | Krishna |

## 8. Milestone states

```mermaid
stateDiagram-v2
  [*] --> pending: created when the client accepts, amounts add up to the price
  pending --> ready: freelancer marks it ready
  pending --> approved: client approves
  ready --> approved: client approves
  approved --> [*]
```

Record only: approving a milestone marks it approved and no money moves.

## 9. How a client finds a freelancer

```mermaid
flowchart LR
  S[Find freelancers] --> F[Filter: search, category, skill, rate, availability]
  F --> C[Freelancer cards, best rated first]
  C --> P[Profile: about, skills, rate, projects]
  P --> J[Post a job]
  J --> A[Freelancers apply]
```

Profiles are sample data. A freelancer edits their own profile on the Profile page and clients see the change straight away.

## 10. Where things live in the app

```mermaid
flowchart LR
  L[Landing page] --> G[Login: Client or Freelancer, email and password]
  G --> C[Client: opens on Find freelancers, top bar with Jobs and Services menus]
  C --> CP[Avatar: client profile with the dashboard underneath]
  G --> F[Freelancer: top bar with Services menu]
  CP --> C1[Dashboard: tiles, activity, attention]
  C --> C2[Find freelancers: chips, cards, profile]
  C --> C3[My jobs: applicants, compare, accept with milestones]
  C --> C4[Saved]
  C --> C5[Post a job: details, budget, review]
  F --> F1[Dashboard]
  F --> F2[Find jobs]
  F --> F3[Profile]
```
