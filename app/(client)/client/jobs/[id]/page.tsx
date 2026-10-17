'use client';
// Job detail: applicants as cards, a side-by-side comparison, and Accept. OWNER: Sanjana. Starter version.
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { acceptApplication, getJob } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Badge, Button, Card, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';
import s from './compare.module.css';

const pct = (value: number, base: number) => Math.round(((value - base) / base) * 100);
const vs = (n: number) => (n === 0 ? 'on target' : `${Math.abs(n)}% ${n < 0 ? 'below' : 'above'}`);

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

  const apps = data?.applications ?? [];
  const cheapest = apps.length ? Math.min(...apps.map((a) => a.proposedPrice)) : 0;
  const canAccept = data?.job.status === 'open';

  return (
    <>
      <ErrorMessage message={error ?? actionError} />
      {loading ? <Spinner /> : null}
      {data ? (
        <>
          <h1>{data.job.title} <Badge>{data.job.status.replace('_', ' ')}</Badge></h1>
          <p>{data.job.description}</p>
          <p className="muted">
            Budget {money(data.job.budget)} · deadline {data.job.deadline}
            {data.typicalTotal ? ` · typical for this kind of work: about ${money(data.typicalTotal)} (illustrative)` : ''}
          </p>

          <h2>Applicants</h2>
          {apps.length === 0 ? <EmptyState>No applicants yet.</EmptyState> : null}

          {apps.length > 1 ? (
            <Card plain title="Compare side by side">
              <div className={s.scroll} tabIndex={0} role="region" aria-label="Applicant comparison table">
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th scope="col">Freelancer</th>
                      <th scope="col">Price</th>
                      <th scope="col">Against budget</th>
                      {data.typicalTotal ? <th scope="col">Against typical</th> : null}
                      <th scope="col">Skills</th>
                      <th scope="col">Pitch</th>
                      <th scope="col"><span className="sr-only">Action</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr key={a.id}>
                        <th scope="row">{a.freelancerName}{a.proposedPrice === cheapest ? <> <Badge tone="good">Lowest</Badge></> : null}</th>
                        <td className={s.nowrap}>{money(a.proposedPrice)}</td>
                        <td>{vs(pct(a.proposedPrice, data.job.budget))}</td>
                        {data.typicalTotal ? <td>{vs(pct(a.proposedPrice, data.typicalTotal))}</td> : null}
                        <td>{(a.freelancerSkills ?? []).join(', ') || 'Not listed'}</td>
                        <td className={s.pitch}>{a.pitch}</td>
                        <td className={s.nowrap}>{canAccept && a.status === 'pending' ? <Button onClick={() => accept(a.id)}>Accept</Button> : <Badge tone={a.status === 'accepted' ? 'good' : a.status === 'rejected' ? 'bad' : 'neutral'}>{a.status}</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          {apps.map((a) => (
            <Card key={a.id}>
              <strong>{a.freelancerName}</strong> <Badge tone={a.status === 'accepted' ? 'good' : a.status === 'rejected' ? 'bad' : 'neutral'}>{a.status}</Badge>
              <p>{a.pitch}</p>
              <p className="muted">Proposed price {money(a.proposedPrice)} ({vs(pct(a.proposedPrice, data.job.budget))} your budget){a.freelancerSkills?.length ? ` · ${a.freelancerSkills.join(', ')}` : ''}</p>
              {canAccept && a.status === 'pending' ? <Button onClick={() => accept(a.id)}>Accept</Button> : null}
            </Card>
          ))}
        </>
      ) : null}
    </>
  );
}
