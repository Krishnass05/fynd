'use client';
// Start page: pick a demo role. OWNER: Krishna (look follows the Crafthire design).
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listDemoUsers } from '@/lib/api';
import { setUserId } from '@/lib/session';
import type { Role } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { Button, ErrorMessage, Spinner } from '@/components/ui';

const ROLES: Array<{ role: Role; title: string; text: string; icon: string }> = [
  { role: 'client', title: 'Client', text: 'Post jobs, hire, and approve every extra request', icon: '\u{1F4BC}' },
  { role: 'freelancer', title: 'Freelancer', text: 'Find jobs, send proposals, and get scope changes in writing', icon: '\u{1F4BB}' },
];

export default function Home() {
  const router = useRouter();
  const { data, error, loading } = useAsync(listDemoUsers, []);
  const pick = (id: string, role: Role) => {
    setUserId(id);
    router.push(role === 'client' ? '/client' : '/freelancer');
  };
  return (
    <div className="welcome">
      <div className="inner">
        <span className="brand">Scope Change Desk</span>
        <section className="hero">
          <h1>Great work starts with a <em>clear</em> scope.</h1>
          <p>Hire a freelancer, share the SOW, and price every extra request before the work starts. All data is synthetic, and this is a workflow aid, not legal advice.</p>
        </section>
        <h2 style={{ textAlign: 'center' }}>Which describes you best?</h2>
        <ErrorMessage message={error} />
        {loading ? <Spinner /> : null}
        <div className="role-grid">
          {ROLES.map((r) => (
            <section key={r.role} className="role-card">
              <div className="role-tile" aria-hidden="true">{r.icon}</div>
              <h2>{r.title}</h2>
              <p>{r.text}</p>
              <div className="row">
                {(data ?? []).filter((u) => u.role === r.role).map((u) => (
                  <Button key={u.id} variant={r.role === 'client' ? 'primary' : 'secondary'} onClick={() => pick(u.id, r.role)}>
                    Continue as {u.name}
                  </Button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 28 }}><Link href="/demo">Run the three case checks</Link></p>
      </div>
    </div>
  );
}
