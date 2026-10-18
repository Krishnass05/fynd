// Signed session cookie. The secret comes from SESSION_SECRET; without one a random secret is made when the server
// starts, so everyone is signed out after a restart (fine for the demo, set SESSION_SECRET when deployed). OWNER: Krishna.
import { randomToken, sign, verify } from '@/lib/engine/authcore';
import type { CookieSpec } from './context';

export const SESSION_COOKIE = 'cd_session';
export const SESSION_DAYS = 7;
const g = globalThis as unknown as { __sessionSecret?: string };

export function secret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (!g.__sessionSecret) g.__sessionSecret = randomToken(32);
  return g.__sessionSecret;
}

const secure = () => process.env.NODE_ENV === 'production';

export function sessionCookie(userId: string): CookieSpec {
  const ttl = SESSION_DAYS * 24 * 3600 * 1000;
  return { name: SESSION_COOKIE, value: sign(secret(), { uid: userId }, ttl), options: { httpOnly: true, sameSite: 'lax', path: '/', secure: secure(), maxAge: SESSION_DAYS * 24 * 3600 } };
}

export const clearSessionCookie = (): CookieSpec => ({ name: SESSION_COOKIE, value: '', options: { httpOnly: true, sameSite: 'lax', path: '/', secure: secure(), maxAge: 0 } });

export function userFromCookie(value: string | null): string | null {
  const p = verify(secret(), value);
  return p && typeof p.uid === 'string' ? p.uid : null;
}

// A short signed note carried through the Google round trip (which button was pressed and where to go back to).
export const OAUTH_COOKIE = 'cd_oauth';
export function oauthCookie(payload: Record<string, unknown>): CookieSpec {
  return { name: OAUTH_COOKIE, value: sign(secret(), payload, 10 * 60 * 1000), options: { httpOnly: true, sameSite: 'lax', path: '/', secure: secure(), maxAge: 600 } };
}
export const clearOauthCookie = (): CookieSpec => ({ name: OAUTH_COOKIE, value: '', options: { httpOnly: true, sameSite: 'lax', path: '/', secure: secure(), maxAge: 0 } });
export const readOauth = (value: string | null) => verify(secret(), value);
