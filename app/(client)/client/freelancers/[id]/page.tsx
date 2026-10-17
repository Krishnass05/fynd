'use client';
// A freelancer's profile as a client sees it. Sample data. OWNER: Krishna (look: Sanjana).
import { useParams } from 'next/navigation';
import { getFreelancer } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Badge, ButtonLink, Card, EmptyState, ErrorMessage, Meta, Spinner, money } from '@/components/ui';
import { Briefcase, MapPin, Rupee, Star } from '@/components/ui/icons';

const STATUS = { open: 'Open', in_progress: 'In progress', closed: 'Closed' } as const;

export default function FreelancerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useAsync(() => getFreelancer(id), [id]);
  return (
    <>
      <p><ButtonLink href="/client/freelancers" variant="secondary">Back to search</ButtonLink></p>
      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}
      {data ? (
        <>
          <h1>{data.name}</h1>
          <p>{data.headline}</p>
          <p className="muted">Sample profile for the demo. Ratings and job counts are made-up numbers.</p>
          <Meta
            items={[
              { icon: <Rupee />, text: data.ratePerHour ? `${money(data.ratePerHour)}/hr` : 'Rate not set' },
              { icon: <Star />, text: data.rating ? `${data.rating.toFixed(1)} rating` : 'No rating yet' },
              { icon: <Briefcase />, text: `${data.jobsDone} jobs` },
              ...(data.location ? [{ icon: <MapPin />, text: data.location }] : []),
            ]}
          />
          <p><Badge tone={data.availability === 'available' ? 'good' : 'warn'}>{data.availability === 'available' ? 'Available' : 'Booked for now'}</Badge> <Badge>{data.category}</Badge></p>

          <Card title="About">
            <p>{data.overview || 'No overview yet.'}</p>
          </Card>
          <Card title="Skills">
            {data.skills.length ? (
              <ul className="pcard-chips" aria-label="Skills">{data.skills.map((s) => <li key={s} className="pcard-chip">{s}</li>)}</ul>
            ) : <p className="muted">No skills listed.</p>}
          </Card>
          <Card title="Projects on this site">
            {data.projects.length === 0 ? <EmptyState>None yet.</EmptyState> : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {data.projects.map((p, i) => <li key={i}>{p.title} <Badge>{STATUS[p.status]}</Badge></li>)}
              </ul>
            )}
          </Card>
          <p><ButtonLink href="/client/jobs/new" variant="primary">Post a job</ButtonLink></p>
        </>
      ) : null}
    </>
  );
}
