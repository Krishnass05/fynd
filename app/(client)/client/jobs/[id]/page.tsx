'use client';
// Job detail with applicants and Accept. OWNER: Sanjana. Starter version: replace with the final design.
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { acceptApplication, getJob } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Badge, Button, Card, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(() => getJob(id), [id]);
  const [actionError, setActionError] = useState<string | null>(null);

  async function accept(applicationId: string) {
    try {
      const { projectId } = await acceptApplication(applicationId);
      router.push(`/client/projects/${projectId}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not accept');
      await reload();
    }
  }

  return (
    <>
      <ErrorMessage message={error ?? actionError} />
      {loading ? <Spinner /> : null}
      {data ? (
        <>
          <h1>{data.job.title} <Badge>{data.job.status.replace('_', ' ')}</Badge></h1>
          <p>{data.job.description}</p>
          <p className="muted">Budget {money(data.job.budget)} · deadline {data.job.deadline}</p>
          <h2>Applicants</h2>
          {data.applications.length === 0 ? <EmptyState>No applicants yet.</EmptyState> : null}
          {data.applications.map((a) => (
            <Card key={a.id}>
              <strong>{a.freelancerName}</strong> <Badge tone={a.status === 'accepted' ? 'good' : a.status === 'rejected' ? 'bad' : 'neutral'}>{a.status}</Badge>
              <p>{a.pitch}</p>
              <p className="muted">Proposed price {money(a.proposedPrice)}</p>
              {data.job.status === 'open' && a.status === 'pending' ? <Button onClick={() => accept(a.id)}>Accept</Button> : null}
            </Card>
          ))}
        </>
      ) : null}
    </>
  );
}
