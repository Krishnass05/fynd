// Accounts: register, log in (password), and sign in with Google. Passwords are checked as salted hashes, sessions are signed
// cookies, repeated wrong passwords lock the email for a while. Email verification and password reset need email (Brevo,
// planned): until then accounts start with emailVerified false and the Google ones with true. OWNER: Krishna.
import { DUMMY_HASH, hashPassword, randomToken, verifyPassword } from '@/lib/engine/authcore';
import { normalizeEmail, validateLogin, validateRegister } from '@/lib/engine/validate';
import type { Role, User } from '@/lib/types';
import { requestRole } from './context';
import { bad, forbidden, tooMany } from './errors';
import { sessionCookie } from './session';
import { db } from './store';

export const DEMO_PASSWORD = 'demo1234';
export const DEMO_LOGINS: Record<string, string> = {
  'client@demo.test': 'u_client1',
  'freelancer@demo.test': 'u_freelancer1',
  'freelancer2@demo.test': 'u_freelancer2',
  'both@demo.test': 'u_both1', // one account, both sides
};

const startSession = (userId: string) => requestRole.getStore()?.cookies.push(sessionCookie(userId));
const emailTaken = (email: string) => Boolean(DEMO_LOGINS[email]) || db().users.some((u) => u.email?.toLowerCase() === email);
const firstError = (errors: Record<string, string>) => Object.values(errors)[0] ?? 'Check the form';

export function newUser(name: string, email: string, accountType: 'client' | 'freelancer' | 'both', verified: boolean): User {
  const role: Role = accountType === 'freelancer' ? 'freelancer' : 'client';
  const u: User = {
    id: `u_${randomToken(6)}`, name, email, role, skills: [], emailVerified: verified,
    ...(accountType === 'both' ? { roles: ['client', 'freelancer'] as Role[] } : {}),
    ...(accountType !== 'client' ? { headline: '', overview: '', location: '', category: 'Other', availability: 'available' as const, jobsDone: 0 } : {}),
  };
  db().users.push(u);
  return u;
}

export function registerAccount(body: Record<string, unknown>): User {
  const { errors, values } = validateRegister(body);
  if (Object.keys(errors).length) throw bad(firstError(errors), errors);
  if (emailTaken(values.email)) throw bad('An account with this email already exists. Log in instead', { email: 'An account with this email already exists. Log in instead' });
  const u = newUser(values.name, values.email, values.accountType, false);
  db().credentials.set(u.id, hashPassword(values.password));
  startSession(u.id);
  // Planned: send the verification email here (Brevo) and keep emailVerified false until the link is opened.
  return u;
}

export function loginAccount(body: Record<string, unknown>): User {
  const { errors, values } = validateLogin(body);
  if (Object.keys(errors).length) throw bad(firstError(errors), errors);
  const wait = db().limiter.check(values.email);
  if (wait > 0) throw tooMany(`Too many wrong attempts. Try again in ${Math.max(1, Math.ceil(wait / 60000))} minute(s).`);

  const demoId = DEMO_LOGINS[values.email];
  const user = demoId ? db().users.find((u) => u.id === demoId) : db().users.find((u) => u.email?.toLowerCase() === values.email);
  const hash = demoId ? undefined : user ? db().credentials.get(user.id) : undefined;
  // Always spend the same time on a password check, so a wrong email and a wrong password look alike.
  const ok = demoId ? values.password === DEMO_PASSWORD : verifyPassword(values.password, hash ?? DUMMY_HASH) && Boolean(hash);
  if (!user || !ok) {
    db().limiter.fail(values.email);
    throw forbidden('Email or password is wrong');
  }
  const sides: Role[] = user.roles ?? [user.role];
  if (!sides.includes(values.role)) throw forbidden(`This is a ${user.role} account. Choose ${user.role === 'client' ? 'Client' : 'Freelancer'} above.`);
  db().limiter.reset(values.email);
  if (!user.demo) startSession(user.id);
  return { ...user, role: values.role };
}

// Sign in with a Google account whose email Google has verified. A new person gets an account for the side they chose.
export function googleSignIn(p: { sub: string; email: string; name: string }, accountType: 'client' | 'freelancer' | 'both'): { user: User; created: boolean } {
  const email = normalizeEmail(p.email);
  const known = db().googleIds.get(p.sub);
  let user = known ? db().users.find((u) => u.id === known) : db().users.find((u) => u.email?.toLowerCase() === email);
  let created = false;
  if (!user) {
    const name = (p.name || email.split('@')[0]).replace(/[^\p{L}\p{M} .'-]/gu, '').trim().slice(0, 80) || 'New user';
    user = newUser(name.length >= 2 ? name : 'New user', email, accountType, true);
    created = true;
  } else if (!user.emailVerified) {
    user.emailVerified = true; // Google has verified this address
  }
  db().googleIds.set(p.sub, user.id);
  if (!user.demo) startSession(user.id);
  return { user, created };
}

export function logoutAccount(): { ok: true } {
  const ctx = requestRole.getStore();
  if (ctx) ctx.cookies.push({ name: 'cd_session', value: '', options: { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 } });
  return { ok: true };
}
