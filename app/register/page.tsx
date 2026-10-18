'use client';
// Create an account. The same rules run here as you type and on the server, which has the final say.
// Email verification (Brevo) is planned: for now an account is usable straight away. OWNER: Krishna.
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ApiError, getAuthConfig, register } from '@/lib/api';
import { validateRegister } from '@/lib/engine/validate';
import { HOME } from '@/lib/nav';
import { setRole, setUserId } from '@/lib/session';
import AppNav from '@/components/shell/AppNav';
import { GOOGLE_MESSAGES, GoogleButton, PasswordField, TextField } from '@/components/auth/Parts';
import { Button, ErrorMessage } from '@/components/ui';

type Type = 'client' | 'freelancer' | 'both';
const TYPES: Array<{ value: Type; title: string; text: string }> = [
  { value: 'client', title: 'I want to hire', text: 'Post jobs and work with freelancers' },
  { value: 'freelancer', title: 'I want to work', text: 'Find jobs and get paid for extra asks' },
  { value: 'both', title: 'Both', text: 'Hire and work from one account' },
];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [accountType, setAccountType] = useState<Type>(params.get('type') === 'freelancer' ? 'freelancer' : params.get('type') === 'both' ? 'both' : 'client');
  const [v, setV] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [accepted, setAccepted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [google, setGoogle] = useState<boolean | null>(null);
  useEffect(() => { void getAuthConfig().then((c) => setGoogle(c.google)).catch(() => setGoogle(false)); }, []);

  const input = { ...v, accountType, acceptedTerms: accepted };
  const found = useMemo(() => validateRegister(input).errors, [v, accountType, accepted]); // eslint-disable-line react-hooks/exhaustive-deps
  const show = (k: string) => (touched[k] ? found[k] ?? serverErrors[k] : serverErrors[k]);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => { setV({ ...v, [k]: e.target.value }); setServerErrors((s) => ({ ...s, [k]: '' })); setFormError(null); };
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));
  const googleNote = params.get('google') ? GOOGLE_MESSAGES[params.get('google') as string] ?? 'Google sign-in did not work. Please try again.' : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true, accountType: true, acceptedTerms: true });
    if (Object.keys(found).length) { setFormError('Please fix the highlighted fields.'); return; }
    setBusy(true);
    setFormError(null);
    try {
      const user = await register({ ...v, accountType, acceptedTerms: accepted });
      setUserId(user.id);
      setRole(user.role);
      router.push(HOME[user.role]);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setServerErrors(err.fields);
      setFormError(err instanceof Error ? err.message : 'Could not create the account');
      setBusy(false);
    }
  }

  return (
    <div className="auth-grid auth-grid--one">
      <form className="authcard" onSubmit={submit} noValidate aria-labelledby="reg-title">
        <h1 id="reg-title">Create your account</h1>
        <p className="muted">Join Crewmate to hire freelancers, find work, or both.</p>
        <ErrorMessage message={googleNote} />

        <GoogleButton enabled={google} href={`/api/auth/google/start?mode=register&type=${accountType}`}>Sign up with Google</GoogleButton>
        <p className="auth-or"><span>or sign up with email</span></p>

        <fieldset className="typepick">
          <legend>How will you use the site?</legend>
          <div role="radiogroup" aria-label="Account type">
            {TYPES.map((t) => (
              <label key={t.value} className="typepick-opt" data-on={accountType === t.value || undefined}>
                <input type="radio" name="accountType" value={t.value} checked={accountType === t.value} onChange={() => setAccountType(t.value)} />
                <strong>{t.title}</strong><span>{t.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <TextField label="Full name" name="name" autoComplete="name" value={v.name} onChange={set('name')} onBlur={blur('name')} error={show('name')} />
        <TextField label="Email" name="email" type="email" autoComplete="email" inputMode="email" value={v.email} onChange={set('email')} onBlur={blur('email')} error={show('email')} placeholder="you@example.com" />
        <PasswordField label="Password" name="password" autoComplete="new-password" value={v.password} onChange={set('password')} onBlur={blur('password')} error={show('password')} meter hint="At least 8 characters, with a letter and a number." />
        <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" value={v.confirmPassword} onChange={set('confirmPassword')} onBlur={blur('confirmPassword')} error={show('confirmPassword')} />

        <div className="afield">
          <label className="check">
            <input type="checkbox" checked={accepted} onChange={(e) => { setAccepted(e.target.checked); setServerErrors((s) => ({ ...s, acceptedTerms: '' })); }} onBlur={blur('acceptedTerms')} aria-invalid={show('acceptedTerms') ? true : undefined} />
            <span>I agree to the <Link href="/terms" target="_blank">terms of use</Link>.</span>
          </label>
          {show('acceptedTerms') ? <p className="afield-error" role="alert">{show('acceptedTerms')}</p> : null}
        </div>

        <ErrorMessage message={formError} />
        <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Creating your account...' : 'Create account'}</Button>
        <p className="muted" style={{ marginBottom: 0 }}>Already have an account? <Link href="/login">Log in</Link></p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main id="main-content" className="welcome">
      <div className="inner">
        <div className="appbar-public"><AppNav /></div>
        <Suspense fallback={null}><RegisterForm /></Suspense>
      </div>
    </main>
  );
}
