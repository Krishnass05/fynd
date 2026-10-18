# Deploying Crewmate (Vercel + Supabase)

About 20 minutes. You need a GitHub account (the repo is there), a free Supabase account and a free Vercel account.

## How the data is kept

Without Supabase keys the app keeps everything in memory (development). With keys it stores the app in Supabase:

- **`app_state`**: one row with the whole app's data as JSON and a version number. Every request loads its own copy; a request that changes something saves it back with "update where version = n". If someone else saved first, the request is run again on the fresh data, so updates are not lost (tested with 14 simultaneous writers).
- **`call_signals`**: the short-lived call set-up messages, in their own table so calls do not rewrite everything.
- Passwords are stored as salted hashes. The service key never leaves the server. Both tables have row level security on with no policies, so the public key can read nothing.

This is a deliberate hackathon shortcut. It is not a normalised schema, and one JSON row will not scale to many thousands of users. It is fine for a demo and a pilot, and the code that talks to it is all in `lib/server/persist.ts`.

## 1. Supabase

1. Go to supabase.com, sign in, **New project**. Name `crewmate`, pick the region nearest your users (Mumbai for India), set a database password (you will not need it in the app), **Create**.
2. Open **SQL Editor**, **New query**, paste the contents of `supabase/schema.sql`, **Run**. You should see "Success". Under **Table Editor** there are now `app_state` and `call_signals`.
3. Open **Project Settings**, **API** (or **API Keys**). Copy two things:
   - **Project URL**, like `https://abcdxyz.supabase.co`
   - the **service_role** key (the older "service role" JWT) or the newer **secret** key (`sb_secret_...`). Either works. This one is powerful: keep it out of chat, git and screenshots.

## 2. Vercel

1. Go to vercel.com, **Add New**, **Project**, import the GitHub repo `Krishnass05/fynd`. Framework: Next.js (detected).
2. **Which branch?** The live site builds from the repo's *Production Branch*. `main` is behind `krishna` until the pull requests are merged. Either merge them, or open **Settings**, **Git**, and set the production branch to `krishna` for the hackathon.
3. Before pressing Deploy, open **Environment Variables** and add these (leave **Preview** ticked too if you want preview links to work):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | the Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | the service or secret key |
| `SESSION_SECRET` | a long random string. Make one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `APP_URL` | your live address, for example `https://crewmate.vercel.app` (set it after the first deploy, then redeploy) |
| `GEMINI_API_KEY` | your Gemini key (optional: without it the AI checks are off and the rules still protect chat) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | your Google client (optional: without them the Google buttons are disabled) |

   Do **not** set `ALLOW_RESET`. Without it the demo "reset" endpoint is switched off on the live site, so nobody can wipe your data.
4. **Deploy.** The first visit fills the database with the demo data (the demo accounts and sample freelancers and jobs).
5. Optional but good: **Settings**, **Functions**, set the region next to your Supabase region (for example Mumbai, `bom1`) so each request is quick.

## 3. After the first deploy

1. Copy your live address, set `APP_URL` to it in Vercel, and redeploy.
2. **Google Cloud console**, your OAuth client: under **Authorised redirect URIs** *add* `https://your-live-address/api/auth/google/callback` (keep the localhost one). Also rename the consent screen app to **Crewmate**.
3. Add your teammates and the judges as **Test users** on the Google consent screen if the app is still in Testing.

## 4. Check it

1. Open the live address. The home page loads.
2. **Sign up** with a new email and log in. Then reload the page and restart nothing: you stay logged in, and the account is in Supabase (Table Editor, `app_state`, the JSON has your user).
3. Log in as `client@demo.test` / `demo1234` in one window and `freelancer@demo.test` in a private window. Post a job, apply, hire, chat. Everything must appear for both people.
4. Try a voice call between the two windows (microphone permission, Chrome or Edge, HTTPS is provided by Vercel).
5. `/api/reset` must answer "Reset is switched off on this site".
6. If a page shows an error, **Vercel, Deployments, Functions (Logs)** shows what happened. The usual causes: a missing environment variable, the SQL not run, or a wrong key.

## Is my change live?

Open `https://your-live-address/api/version`. It shows the commit the live site was built from (for example `{"commit":"3fd1717","branch":"krishna","env":"production"}`). If it is not your latest commit:

- In **Deployments**, a build labelled **Preview** is not live. Use **⋯ → Promote to Production**.
- A grey **Production** label (with a clock) means built but waiting: **⋯ → Promote**. Only the build with the **blue** Production label is what the live address serves.
- "Redeploy" rebuilds the same commit; it does not pick up newer commits. If the dialog warns "auto-assignment is disabled" (this happens after a rollback), new builds will not go live by themselves until one is promoted.
- So that every push to `krishna` goes live: **Settings → Environments → Production → Branch Tracking** = `krishna`.

## Things to know

- **Free plans:** Supabase free projects pause after about a week without use (open the dashboard and press Restore). Vercel Hobby is for non-commercial use and has function time limits; the routes that call the AI model ask for up to 30 seconds.
- **Login lockout** (5 wrong passwords, 10 minutes) is saved in `app_state`, so it holds across servers.
- **Email (Brevo) is not connected yet.** Accounts are created as "email not verified" and there is no password reset yet. See `docs/AUTH.md`.
- **Calls** use a public Google STUN server to find a route. Some strict networks need a TURN server, which is not set up.
- **Backups:** Supabase free keeps no point-in-time backups. Export the `app_state` row from the Table Editor before anything risky.
- **Testing without Supabase:** `node scripts/supabase-mock.cjs`, start the app with `SUPABASE_URL=http://localhost:4030 SUPABASE_SERVICE_ROLE_KEY=test-service-key SESSION_SECRET=test npm run dev`, then `node scripts/supabase-check.mjs write`, restart the app, and `node scripts/supabase-check.mjs read`.
