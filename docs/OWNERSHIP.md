# Who edits what

Editing only your own folders is how we avoid merge conflicts. GitHub also asks the owner to review changes to their folders (see `.github/CODEOWNERS`).

| Person | GitHub | Folders and files only they edit |
| --- | --- | --- |
| Krishna | Krishnass05 | `app/api/**`, `lib/**` (engine, server, types, api, session, hooks, nav), `supabase/**`, `app/(freelancer)/**`, `app/page.tsx`, `app/pricing/**`, `lib/pricing.ts`, `app/demo/**`, `components/sow/**`, `components/milestones/**`, `components/tasks/**`, `components/work/**`, `app/(client)/client/freelancers/**`, `components/fx/**` (React Bits animations), `docs/DESIGN_SYSTEM.md`, `decision.md`, `flow.md`, `scripts/**`, `fixture.json`, `docs/API_CONTRACT.md` |
| Sanjana | vincezo-ks | `components/ui/**`, `components/shell/**`, `app/globals.css`, `app/(client)/layout.tsx`, `app/(client)/client/page.tsx`, `app/(client)/client/jobs/**`, her `frontend/` design folder |
| Harini | chinthakuntaharini | `components/chat/**`, `components/changes/**`, `app/(client)/client/projects/**` |
| Swapnil | swapnil2648r-droid | `docs/sow/**` (his own files), demo script and business-proof documents |

## Rules

1. Work on your own branch (`krishna`, `sanjana`, `harini`, `swapnil`). Never push to `main`.
2. Open a pull request to `main` every 2 to 4 hours. Krishna merges.
3. `git pull origin main` before every session.
4. Before a pull request, run `npm test` and `npm run build`. Both must pass.
5. Need something from another person's folder? Message them. Do not edit it.
6. If you add a component that others use, keep its export name and props stable.
7. Never commit `.env.local` or any key. The repo is public.

## Keeping shared components stable

- `components/ui` (Sanjana) exports `Button`, `Card`, `Badge`, `ErrorMessage`, `EmptyState`, `Spinner`, `Field`, `money`. Restyle them freely, but keep these names and props.
- `components/chat/Chat` (Harini) takes `{ projectId }`. `components/changes/ChangeList` (Harini) takes `{ projectId, changes, canDecide, onChanged }`. The freelancer pages use both.
- `components/sow/SowUpload` (Krishna) takes `{ projectId, kind, onDone }`. Both sides use it.
