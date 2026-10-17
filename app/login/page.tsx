'use client';
// Login for clients and freelancers. OWNER: Krishna. Demo accounts only, see lib/server/service.ts.
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { login } from '@/lib/api';
import { setUserId } from '@/lib/session';
import type { Role } from '@/lib/types';
import AppNav from '@/components/shell/AppNav';
import { Button, ErrorMessage } from '@/components/ui';

const DEMOS: Array<{ role: Role; name: string; email: string }> = [
  { role: 'client', name: 'Demo Client', email: 'client@demo.test' },
  { role: 'freelancer', name: 'Demo Freelancer', email: 'freelancer@demo.test' },
  { role: 'freelancer', name: 'Second Freelancer', email: 'freelancer2@demo.test' },
];
const DEMO_PASSWORD = 'demo1234';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<Role>(params.get('role') === 'freelancer' ? 'freelancer' : 'client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await login({ email, password, role });
      setUserId(user.id);
      router.push(user.role === 'client' ? '/client' : '/freelancer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in');
      setBusy(false);
    }
  };

  return (
    <div className="auth-grid">
      <form className="authcard" onSubmit={submit} noValidate aria-labelledby="login-title">
        <h1 id="login-title">Log in</h1>
        <p className="muted">Welcome back. Choose how you use Scope Change Desk.</p>
        <div className="seg" role="group" aria-label="Account type">
          {(['client', 'freelancer'] as Role[]).map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => { setRole(r); setError(null); }}>
              {r === 'client' ? 'Client' : 'Freelancer'}
            </button>
          ))}
        </div>
        <label className="field">Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label className="field">Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <ErrorMessage message={error} />
        <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Logging in...' : `Log in as ${role}`}</Button>
        <p className="muted" style={{ marginBottom: 0 }}>New here? Account sign-up is not built yet; use a demo account.</p>
      </form>

      <aside className="authcard demo-box" aria-labelledby="demo-title">
        <h2 id="demo-title">Demo accounts</h2>
        <p className="muted">All data is synthetic. The shared password is <code>{DEMO_PASSWORD}</code>.</p>
        <ul>
          {DEMOS.map((d) => (
            <li key={d.email}>
              <span><strong>{d.name}</strong><small>{d.role} · {d.email}</small></span>
              <Button type="button" variant="secondary" onClick={() => { setRole(d.role); setEmail(d.email); setPassword(DEMO_PASSWORD); setError(null); }}>Fill in</Button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main id="main-content" className="welcome">
      <div className="inner">
        <div className="appbar-public"><AppNav /></div>
        <Suspense fallback={null}><LoginForm /></Suspense>
        <p className="muted" style={{ textAlign: 'center' }}><Link href="/">Back to the start page</Link></p>
      </div>
    </main>
  );
}
