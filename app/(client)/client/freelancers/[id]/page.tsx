'use client';
// A freelancer's profile as a client sees it: header, tabs, and a hire card. Sample data. OWNER: Krishna (look: Sanjana).
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { getFreelancer, setSaved } from '@/lib/api';
import { initials } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { Badge, Button, ButtonLink, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';
import { Briefcase, Heart, MapPin, Star } from '@/components/ui/icons';

const STATUS = { open: 'Open', in_progress: 'In progress', closed: 'Closed' } as const;

export default function FreelancerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, setData } = useAsync(() => getFreelancer(id), [id]);
  const [tab, setTab] = useState<'overview' | 'projects'>('overview');
  const [saveError, setSaveError] = useState<string | null>(null);

  async function toggleSave() {
    if (!data) return;
    const next = !data.saved;
    setData({ ...data, saved: next });
    try {
      await setSaved(data.id, next);
      setSaveError(null);
    } catch (e) {
      setData({ ...data, saved: !next });
      setSaveError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <>
      <p><ButtonLink href="/client/freelancers" variant="secondary">Back to search</ButtonLink></p>
      <ErrorMessage message={error ?? saveError} />
      {loading && !data ? <Spinner /> : null}
      {data ? (
        <div className="profile">
          <div>
            <div className="profile-head">
              <span className="profile-photo" aria-hidden="true">{initials(data.name)}</span>
              <div>
                <h1>{data.name}</h1>
                <p style={{ margin: '4px 0' }}>{data.headline}</p>
                <p className="muted" style={{ margin: 0 }}>{data.location ? <><MapPin size={14} /> {data.location} · </> : null}{data.category}</p>
              </div>
              <div className="ratingbox">
                <strong><Star size={18} /> {data.rating ? data.rating.toFixed(1) : 'New'}</strong>
                <div className="muted">{data.jobsDone} jobs (sample)</div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 12 }}>Sample profile for the demo. Ratings and job counts are made-up numbers, not real reviews.</p>

            <div className="tabs" role="tablist" aria-label="Profile sections">
              <button type="button" role="tab" id="tab-overview" className="tab" aria-selected={tab === 'overview'} aria-controls="panel-overview" onClick={() => setTab('overview')}>Overview</button>
              <button type="button" role="tab" id="tab-projects" className="tab" aria-selected={tab === 'projects'} aria-controls="panel-projects" onClick={() => setTab('projects')}>Projects</button>
            </div>

            {tab === 'overview' ? (
              <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
                <h2 style={{ marginTop: 0 }}>About</h2>
                <p>{data.overview || 'No overview yet.'}</p>
                <h2>Skills</h2>
                {data.skills.length ? <ul className="fcard-chips" aria-label="Skills">{data.skills.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="muted">No skills listed.</p>}
                <div className="statrow">
                  <div><strong>{data.jobsDone}</strong><span>Jobs (sample)</span></div>
                  <div><strong>{data.projects.length}</strong><span>Projects on this site</span></div>
                  <div><strong>{data.rating ? data.rating.toFixed(1) : '-'}</strong><span>Rating (sample)</span></div>
                </div>
              </div>
            ) : (
              <div role="tabpanel" id="panel-projects" aria-labelledby="tab-projects">
                {data.projects.length === 0 ? <EmptyState>No projects on this site yet.</EmptyState> : (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {data.projects.map((p, i) => <li key={i}>{p.title} <Badge>{STATUS[p.status]}</Badge></li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          <aside className="hirecard" aria-label="Hire">
            <div className="muted">Hourly rate</div>
            <div className="rate">{data.ratePerHour ? `${money(data.ratePerHour)}/hr` : 'Not set'}</div>
            <div><Badge tone={data.availability === 'available' ? 'good' : 'warn'}>{data.availability === 'available' ? 'Available now' : 'Booked for now'}</Badge></div>
            <p className="muted" style={{ margin: 0 }}><Briefcase size={14} /> Post a job and this freelancer can apply.</p>
            <ButtonLink href="/client/jobs/new" variant="dark">Post a job</ButtonLink>
            <Button type="button" variant="secondary" aria-pressed={Boolean(data.saved)} onClick={toggleSave}>
              <Heart size={18} filled={Boolean(data.saved)} />&nbsp;{data.saved ? 'Saved' : 'Save'}
            </Button>
          </aside>
        </div>
      ) : null}
    </>
  );
}
