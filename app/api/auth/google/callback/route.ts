import { NextResponse } from 'next/server';
import { readCookie } from '@/lib/engine/authcore';
import { googleSignIn } from '@/lib/server/auth';
import { fetchProfile, googleConfig } from '@/lib/server/google';
import { requestRole, type RequestContext } from '@/lib/server/context';
import { OAUTH_COOKIE, clearOauthCookie, readOauth } from '@/lib/server/session';

// Step 2: Google sends the person back with a one-time code. Check the state, get their verified profile, sign them in.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = process.env.APP_URL?.replace(/\/$/, '') || url.origin;
  const note = readOauth(readCookie(req.headers.get('cookie'), OAUTH_COOKIE));
  const mode = note?.mode === 'register' ? 'register' : 'login';
  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${origin}/${mode}?google=${reason}`);
    const c = clearOauthCookie();
    res.cookies.set(c.name, c.value, c.options);
    return res;
  };
  const cfg = googleConfig();
  if (!cfg) return fail('not_configured');
  if (url.searchParams.get('error')) return fail('denied');
  const code = url.searchParams.get('code');
  if (!note || !code || typeof note.state !== 'string' || url.searchParams.get('state') !== note.state) return fail('state');
  const profile = await fetchProfile(cfg, code, `${origin}/api/auth/google/callback`);
  if (!profile) return fail('unverified');

  // googleSignIn works on the in-memory store and queues the session cookie on the request context.
  const ctx: RequestContext = { role: null, sessionUserId: null, cookies: [], origin, ip: 'google' };
  const result = requestRole.run(ctx, () => googleSignIn(profile, note.accountType === 'freelancer' || note.accountType === 'both' ? note.accountType : 'client'));
  const user = result.user;
  const side = user.roles?.includes(note.accountType === 'freelancer' ? 'freelancer' : 'client') ? (note.accountType === 'freelancer' ? 'freelancer' : 'client') : user.role;
  const next = typeof note.next === 'string' ? note.next : '';
  const res = NextResponse.redirect(`${origin}/auth/done?role=${side}${next ? `&next=${encodeURIComponent(next)}` : ''}`);
  for (const c of ctx.cookies) res.cookies.set(c.name, c.value, c.options);
  const clear = clearOauthCookie();
  res.cookies.set(clear.name, clear.value, clear.options);
  return res;
}
