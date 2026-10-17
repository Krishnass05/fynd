'use client';
// Job detail and apply. OWNER: Krishna.
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { applyToJob, getJob, listProjects } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Badge, Button, Card, ErrorMessage, Field, Spinner, money } from '@/components/ui';

export default function JobApply() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useAsync(() => getJob(id), [id]);
  const projects = useAsync(listProjects, []);
  const [applyError, setApplyError] = useState<string | null>(null);

  async function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await applyToJob(id, { pitch: String(f.get('pitch') ?? ''), proposedPrice: Number(f.get('price')) });
      setApplyError(null);
      await reload();
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Could not apply');
    }
  }

  const mine = data?.applications[0];
  const project = projects.data?.find((p) => p.jobId === id);
  return (
    <>
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      {data ? (
        <>
          <h1>{data.job.title} <Badge>{data.job.status.replace('_', ' ')}</Badge></h1>
          <p>{data.job.description}</p>
          <p className="muted">Budget {money(data.job.budget)} · deadline {data.job.deadline}</p>
          {mine ? (
            <Card title="Your application">
              <Badge tone={mine.status === 'accepted' ? 'good' : mine.status === 'rejected' ? 'bad' : 'neutral'}>{mine.status}</Badge>
              <p>{mine.pitch}</p>
              <p className="muted">Your price {money(mine.proposedPrice)}</p>
              {project ? <Link href={`/freelancer/projects/${project.id}`}>Open the project workspace</Link> : null}
            </Card>
          ) : data.job.status === 'open' ? (
            <Card title="Apply">
              <form onSubmit={apply}>
                <ErrorMessage message={applyError} />
                <Field label="Short pitch"><textarea name="pitch" required rows={3} maxLength={1000} /></Field>
                <Field label="Your price (rupees)"><input name="price" type="number" min={1} step={1} required /></Field>
                <Button type="submit">Send application</Button>
              </form>
            </Card>
          ) : null}
        </>
      ) : null}
    </>
  );
}
