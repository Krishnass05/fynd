# Accounts, sign-in and Google

How people register and log in, how the session works, how to switch Google sign-in on, and where email (Brevo) will plug in. All data is synthetic and, for now, lives in server memory: **registered accounts are erased when the server restarts** (and by `/api/reset`). Supabase will keep them.

## Pages

| Page | What it does |
| --- | --- |
| `/register` | Create an account: name, email, how you will use the site (hire, work or both), password with a strength meter, confirm password, terms. Or continue with Google |
| `/login` | Log in with email and password, choose Client or Freelancer, or continue with Google. The demo accounts box stays for the judges |
| `/auth/done` | The landing after Google: it learns who is signed in from the cookie and sends them to the right side |
| `/terms` | The short terms the sign-up box links to |

## Validation

One set of rules in `lib/engine/validate.js`, used by the pages (messages while you type, after you leave a field, and on submit) and by the server (which has the final say, and returns a message for each field).

- **Name:** 2 to 80 characters, letters, spaces, dots, apostrophes and hyphens (any language).
- **Email:** `something@something.tld`, no spaces, 254 characters at most, saved in lower case. One account per email.
- **Password:** 8 to 72 characters, at least one letter and one number, not a common password (`Password1`, `12345678`), not your email, not containing your name.
- **Confirm password** must match. **Terms** must be ticked. **Account type** must be hire, work or both.
- The log-in form checks the same email rule and that a password was typed.

## Security

- **Passwords** are stored only as a salted scrypt hash (`lib/engine/authcore.js`). They are never returned by the API or logged.
- **Sessions** are a signed, HTTP-only, SameSite=Lax cookie (`cd_session`, 7 days, `Secure` in production). Page scripts cannot read it. Set `SESSION_SECRET` when deployed; without it a random secret is made at start-up, so everyone is signed out after a restart.
- **Registered accounts cannot be impersonated.** The browser still sends `x-demo-user`, but the server only believes it for demo accounts. A registered account needs its signed cookie, and the cookie of one account cannot act as another.
- **Wrong passwords are counted** per email. After 5, that email is locked for 10 minutes ("Too many wrong attempts"). A wrong password and an unknown email give the same message and take the same time.
- **Log out** clears the cookie on the server.
- Not built yet: email verification, password reset, "log out everywhere", two-factor.

## Google sign-in

It switches on by itself when these are set in `.env.local` (never commit them):

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APP_URL=http://localhost:3000     (your real address when deployed)
```

1. Go to console.cloud.google.com, make or choose a project, and open **APIs and services**, then **OAuth consent screen**. Set the app name and your email, and add yourself as a test user.
2. Open **Credentials**, then **Create credentials**, then **OAuth client ID**, type **Web application**.
3. Under **Authorised redirect URIs** add `http://localhost:3000/api/auth/google/callback`, and later the same path on your live address.
4. Copy the client ID and secret into `.env.local`, restart `npm run dev`. `GET /api/auth/config` should say `{"google":true}` and the Google buttons turn on.

How it behaves: only a **Google-verified email** is trusted. A new person gets an account for the side they chose on the page (hire, work or both) with `emailVerified` true. If the email already has a password account, Google joins that account. A wrong or missing state, a reused code, a cancelled sign-in and an unverified email all send the person back to the page with a clear message.

Tested without a Google account: `node scripts/google-mock.cjs`, start the app with the settings at the top of `scripts/google-check.mjs`, then `npm run google:check`.

## Brevo (email) later

Nothing is sent yet. The places it will plug in:

- **Verification email** after `registerAccount` in `lib/server/auth.ts` (a comment marks the spot). Accounts start with `emailVerified: false`; a signed link will set it to true.
- **Welcome email** after the first verification.
- **Password reset:** a "forgot password" link on `/login` (currently a note) that emails a signed, one-hour link to a reset page.
- Brevo needs an account and an API key (`BREVO_API_KEY` in `.env.local`), a verified sender address and, for good delivery, a domain with SPF and DKIM set up. Brevo's free plan has a daily sending limit; check it.
