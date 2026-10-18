import { NextResponse } from 'next/server';
import { randomToken } from '@/lib/engine/authcore';
import { authorizeUrl, googleConfig } from '@/lib/server/google';
import { oauthCookie } from '@/lib/server/session';

// Step 1: send the person to Google. The state is kept in a signed cookie so the way back can be trusted.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = process.env.APP_URL?.replace(/\/$/, '') || url.origin;
  const mode = url.searchParams.get('mode') === 'register' ? 'register' : 'login';
  const back = `${origin}/${mode === 'register' ? 'register' : 'login'}`;
  const cfg = googleConfig();
  if (!cfg) return NextResponse.redirect(`${back}?google=not_configured`);
  const type = url.searchParams.get('type');
  const accountType = type === 'freelancer' || type === 'both' ? type : 'client';
  const next = url.searchParams.get('next') ?? '';
  const state = randomToken(18);
  const res = NextResponse.redirect(authorizeUrl(cfg, `${origin}/api/auth/google/callback`, state));
  const c = oauthCookie({ state, mode, accountType, next: next.startsWith('/') && !next.startsWith('//') ? next : '' });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
