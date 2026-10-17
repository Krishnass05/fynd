'use client';
// Browse open jobs. OWNER: Krishna.
import Link from 'next/link';
import { listJobs } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Badge, Card, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';

export default function FindJobs() {
  const { data, error, loading } = useAsync(() => listJobs(), []);
  return (
    <>
      <h1>Find jobs</h1>
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      {data?.length === 0 ? <EmptyState>No open jobs right now.</EmptyState> : null}
      {(data ?? []).map((j) => (
        <Card key={j.id}>
          <Link href={`/freelancer/jobs/${j.id}`}><strong>{j.title}</strong></Link> <Badge>{j.status.replace('_', ' ')}</Badge>
          <p>{j.description}</p>
          <p className="muted">Budget {money(j.budget)} · deadline {j.deadline}</p>
        </Card>
      ))}
    </>
  );
}
