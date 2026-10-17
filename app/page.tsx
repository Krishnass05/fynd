'use client';
// Start page: pick a demo role. OWNER: Krishna.
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listDemoUsers } from '@/lib/api';
import { setUserId } from '@/lib/session';
import { useAsync } from '@/lib/useAsync';
import { Button, Card, ErrorMessage, Spinner } from '@/components/ui';

export default function Home() {
  const router = useRouter();
  const { data, error, loading } = useAsync(listDemoUsers, []);
  const pick = (id: string, role: string) => {
    setUserId(id);
    router.push(role === 'client' ? '/client' : '/freelancer');
  };
  return (
    <main className="page">
      <h1>Scope Change Desk</h1>
      <p className="muted">Post a job, hire a freelancer, share the SOW, and price every extra request before work starts. All data is synthetic. This is a workflow aid, not legal advice.</p>
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      <Card title="Continue as a demo user">
        <div className="row">
          {(data ?? []).map((u) => (
            <Button key={u.id} variant={u.role === 'client' ? 'primary' : 'secondary'} onClick={() => pick(u.id, u.role)}>
              {u.name} ({u.role})
            </Button>
          ))}
        </div>
      </Card>
      <p><Link href="/demo">Run the three case checks</Link></p>
    </main>
  );
}
