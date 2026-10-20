// Sign in with Google (OAuth 2.0 authorisation code flow). It is switched on by GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
// Set the redirect URI in the Google Cloud console to <your site>/api/auth/google/callback. The endpoints can be
// replaced with GOOGLE_AUTH_URL, GOOGLE_TOKEN_URL and GOOGLE_USERINFO_URL, which is how it is tested without Google. OWNER: Krishna.

export function googleConfig() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) return null;
  return {
    id,
    secret,
    authUrl: process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token',
    userinfoUrl: process.env.GOOGLE_USERINFO_URL || 'https://openidconnect.googleapis.com/v1/userinfo',
  };
}

async function timed(url: string, init: RequestInit, ms = 8000): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctl.signal }); } finally { clearTimeout(t); }
}

export function authorizeUrl(cfg: NonNullable<ReturnType<typeof googleConfig>>, redirectUri: string, state: string): string {
  const q = new URLSearchParams({ client_id: cfg.id, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
  return `${cfg.authUrl}?${q.toString()}`;
}

// Swaps the one-time code for the person's verified profile. Returns null if anything is off.
export async function fetchProfile(cfg: NonNullable<ReturnType<typeof googleConfig>>, code: string, redirectUri: string): Promise<{ sub: string; email: string; name: string } | null> {
  try {
    const tok = await timed(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: cfg.id, client_secret: cfg.secret, redirect_uri: redirectUri, grant_type: 'authorization_code' }).toString(),
    });
    if (!tok.ok) return null;
    const access = ((await tok.json()) as { access_token?: unknown }).access_token;
    if (typeof access !== 'string' || !access) return null;
    const res = await timed(cfg.userinfoUrl, { headers: { authorization: `Bearer ${access}` } });
    if (!res.ok) return null;
    const p = (await res.json()) as { sub?: unknown; email?: unknown; email_verified?: unknown; name?: unknown };
    // Only a Google-verified email is trusted: otherwise anyone could claim someone else's address.
    if (typeof p.sub !== 'string' || typeof p.email !== 'string' || (p.email_verified !== true && p.email_verified !== 'true')) return null;
    return { sub: p.sub, email: p.email, name: typeof p.name === 'string' ? p.name : '' };
  } catch {
    return null;
  }
}
