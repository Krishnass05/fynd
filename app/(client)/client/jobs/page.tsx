'use client';
// My jobs list. OWNER: Sanjana. Starter version: replace with the final design.
import Link from 'next/link';
import { listJobs } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Badge, Card, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';

export default function MyJobs() {
  const { data, error, loading } = useAsync(() => listJobs({ mine: true }), []);
  return (
    <>
      <h1>My jobs</h1>
      <p><Link href="/client/jobs/new">Post a job</Link></p>
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      {data?.length === 0 ? <EmptyState>You have not posted any jobs yet.</EmptyState> : null}
      {(data ?? []).map((j) => (
        <Card key={j.id}>
          <Link href={`/client/jobs/${j.id}`}><strong>{j.title}</strong></Link> <Badge>{j.status.replace('_', ' ')}</Badge>
          <p className="muted">Budget {money(j.budget)} · deadline {j.deadline}</p>
        </Card>
      ))}
    </>
  );
}
