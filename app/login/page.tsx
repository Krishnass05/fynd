'use client';
// Log in for clients and freelancers: email and password with validation, and Google sign-in.
// Wrong passwords are counted on the server and lock the email for a few minutes. OWNER: Krishna.
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ApiError, getAuthConfig, login } from '@/lib/api';
import { validateLogin } from '@/lib/engine/validate';
import { HOME } from '@/lib/nav';
import { setRole, setUserId } from '@/lib/session';
import type { Role } from '@/lib/types';
import AppNav from '@/components/shell/AppNav';
import { GOOGLE_MESSAGES, GoogleButton, PasswordField, TextField } from '@/components/auth/Parts';
import { Button, ErrorMessage } from '@/components/ui';


function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRoleChoice] = useState<Role>(params.get('role') === 'freelancer' ? 'freelancer' : 'client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [google, setGoogle] = useState<boolean | null>(null);
  useEffect(() => { void getAuthConfig().then((c) => setGoogle(c.google)).catch(() => setGoogle(false)); }, []);

  const found = useMemo(() => validateLogin({ email, password, role }).errors, [email, password, role]);
  const show = (k: string) => (touched[k] ? found[k] ?? serverErrors[k] : serverErrors[k]);
  const googleNote = params.get('google') ? GOOGLE_MESSAGES[params.get('google') as string] ?? 'Google sign-in did not work. Please try again.' : null;
  const next = params.get('next');
  const googleHref = `/api/auth/google/start?mode=login&type=${role}${next ? `&next=${encodeURIComponent(next)}` : ''}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (Object.keys(found).length) { setError('Please fix the highlighted fields.'); return; }
    setError(null);
    setBusy(true);
    try {
      const user = await login({ email, password, role });
      setUserId(user.id);
      setRole(user.role);
      // Come back to the page that sent you here (for example a search from the home page), if it is on your side.
      router.push(next && next.startsWith(`/${user.role}`) && !next.startsWith('//') ? next : HOME[user.role]);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setServerErrors(err.fields);
      setError(err instanceof Error ? err.message : 'Could not log in');
      setBusy(false);
    }
  };

  return (
    <div className="auth-grid auth-grid--one">
      <form className="authcard" onSubmit={submit} noValidate aria-labelledby="login-title">
        <h1 id="login-title">Log in</h1>
        <p className="muted">Welcome back. Choose how you use Crewmate.</p>
        <div className="seg" role="group" aria-label="Account type">
          {(['client', 'freelancer'] as Role[]).map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => { setRoleChoice(r); setError(null); }}>
              {r === 'client' ? 'Client' : 'Freelancer'}
            </button>
          ))}
        </div>

        <ErrorMessage message={googleNote} />
        <GoogleButton enabled={google} href={googleHref}>Continue with Google</GoogleButton>
        <p className="auth-or"><span>or log in with email</span></p>

        <TextField label="Email" name="email" type="email" autoComplete="username" inputMode="email" value={email}
          onChange={(e) => { setEmail(e.target.value); setServerErrors({}); setError(null); }} onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={show('email')} placeholder="you@example.com" />
        <PasswordField label="Password" name="password" autoComplete="current-password" value={password}
          onChange={(e) => { setPassword(e.target.value); setServerErrors({}); setError(null); }} onBlur={() => setTouched((t) => ({ ...t, password: true }))} error={show('password')} />
        <p className="afield-hint" style={{ margin: '-6px 0 12px' }}>Forgot your password? Reset by email is coming with the email setup.</p>

        <ErrorMessage message={error} />
        <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Logging in...' : `Log in as ${role}`}</Button>
        <p className="muted" style={{ marginBottom: 0 }}>New here? <Link href="/register">Create an account</Link></p>
      </form>

    </div>
  );
}

export default function LoginPage() {
  return (
    <main id="main-content" className="welcome">
      <div className="inner">
        <div className="appbar-public"><AppNav /></div>
        <Suspense fallback={null}><LoginForm /></Suspense>
        <p className="muted" style={{ textAlign: 'center' }}><Link href="/start">Back to the start page</Link></p>
      </div>
    </main>
  );
}
