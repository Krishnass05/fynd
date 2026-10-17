'use client';
// Freelancer dashboard: what needs attention, projects with capacity, applications, jobs to apply to. OWNER: Krishna.
import Link from 'next/link';
import { getFreelancerDashboard } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useUser } from '@/lib/useUser';
import type { CSSProperties } from 'react';
import CountUp from '@/components/fx/CountUp';
import SpotlightCard from '@/components/fx/SpotlightCard';
import { Badge, Card, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';
import s from './dashboard.module.css';

// Flat look: the card draws its own thin border; surface and shadow come from our tokens.
const CARD_STYLE = { '--spotlight-card-surface': 'var(--card)', '--spotlight-card-shadow': 'none', padding: '16px 18px', borderRadius: 'var(--radius)' } as CSSProperties;

export default function FreelancerDashboard() {
  const { user } = useUser('freelancer');
  const { data, error, loading } = useAsync(getFreelancerDashboard, []);
  return (
    <>
      <h1 className={s.greeting}>{user ? `Welcome back, ${user.name}` : 'Dashboard'}</h1>
      <p className="muted">Your projects, what needs you, and jobs worth a look. Amounts are before tax.</p>
      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}
      {data ? (
        <>
          <section className={s.stats} aria-label="Summary">
            <div className={s.stat}><div className={s.statValue}><CountUp to={data.stats.activeProjects} duration={0.9} /></div><div className={s.statLabel}>Active projects</div></div>
            <div className={s.stat}><div className={s.statValue}><CountUp to={data.stats.pendingApplications} duration={0.9} /></div><div className={s.statLabel}>Applications waiting</div></div>
            <div className={s.stat}><div className={s.statValue}><CountUp to={data.stats.openJobs} duration={0.9} /></div><div className={s.statLabel}>Open jobs to apply to</div></div>
            <div className={s.stat}><div className={s.statValue}><CountUp to={data.stats.approvedValue} prefix={'₹'} separator="," duration={1.1} /></div><div className={s.statLabel}>Approved change value</div></div>
          </section>

          <h2>Needs your attention</h2>
          {data.attention.length === 0 ? (
            <EmptyState>Nothing is waiting on you.</EmptyState>
          ) : (
            <ul className={s.attention}>
              {data.attention.map((a, i) => (
                <li key={i}>
                  <Badge tone={a.kind === 'rejected_change' ? 'bad' : a.kind === 'awaiting_client' ? 'neutral' : 'warn'}>{a.projectTitle}</Badge>
                  <span>{a.text}</span>
                  <Link href={`/freelancer/projects/${a.projectId}`}>Open</Link>
                </li>
              ))}
            </ul>
          )}

          <h2>My projects</h2>
          {data.projects.length === 0 ? (
            <EmptyState>No projects yet. <Link href="/freelancer/jobs">Find a job</Link> and apply.</EmptyState>
          ) : (
            <div className={s.projectGrid}>
              {data.projects.map((p) => {
                const pct = Math.min(100, Math.round((p.totals.committedHours / (p.project.availableHours || 1)) * 100));
                return (
                  <SpotlightCard key={p.project.id} theme="light" className={s.project} style={CARD_STYLE} spotlightColor="var(--brand)" intensity={0.5}>
                    <h3><Link href={`/freelancer/projects/${p.project.id}`}>{p.project.jobTitle}</Link></h3>
                    <div className="muted">For {p.clientName} · {money(p.project.ratePerHour)}/hr</div>
                    <div className={s.bar} role="img" aria-label={`${pct}% of capacity committed`}>
                      <div className={`${s.barFill} ${pct >= 100 ? s.barFillFull : ''}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="muted">{p.totals.committedHours}h of {p.project.availableHours}h committed · {p.totals.remainingHours}h left</div>
                    <div className={s.chips}>
                      {!p.hasBaseline ? <Badge tone="warn">Signed SOW missing</Badge> : null}
                      {p.counts.awaitingClient ? <Badge>{p.counts.awaitingClient} awaiting client</Badge> : null}
                      {p.counts.needsClarification ? <Badge tone="warn">{p.counts.needsClarification} need hours</Badge> : null}
                      {p.counts.rejected ? <Badge tone="bad">{p.counts.rejected} rejected</Badge> : null}
                      {p.counts.approved ? <Badge tone="good">{p.counts.approved} approved</Badge> : null}
                    </div>
                    <div><strong>{money(p.totals.committedValue)}</strong> <span className="muted">approved changes</span></div>
                  </SpotlightCard>
                );
              })}
            </div>
          )}

          <h2>My applications</h2>
          {data.applications.length === 0 ? (
            <EmptyState>You have not applied to any job yet.</EmptyState>
          ) : (
            <div className={s.list}>
              {data.applications.map((a) => (
                <div key={a.id} className={s.listItem}>
                  <Link href={`/freelancer/jobs/${a.jobId}`}>{a.jobTitle ?? a.jobId}</Link>
                  <span className="muted">Your price {money(a.proposedPrice)}</span>
                  <Badge tone={a.status === 'accepted' ? 'good' : a.status === 'rejected' ? 'bad' : 'neutral'}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}

          <h2>Jobs you could apply to</h2>
          {data.openJobs.length === 0 ? (
            <EmptyState>No new open jobs right now.</EmptyState>
          ) : (
            <div className={s.list}>
              {data.openJobs.map((j) => (
                <Card key={j.id}>
                  <Link href={`/freelancer/jobs/${j.id}`}><strong>{j.title}</strong></Link>
                  <p className="muted" style={{ margin: '4px 0 0' }}>Budget {money(j.budget)} · deadline {j.deadline}</p>
                </Card>
              ))}
              <Link href="/freelancer/jobs">See all open jobs</Link>
            </div>
          )}
        </>
      ) : null}
    </>
  );
}
