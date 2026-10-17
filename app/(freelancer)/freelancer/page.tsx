'use client';
// Freelancer dashboard: what needs attention, projects with capacity, applications, jobs to apply to. OWNER: Krishna.
import Link from 'next/link';
import { getFreelancerDashboard } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useUser } from '@/lib/useUser';
import CountUp from '@/components/fx/CountUp';
import { Badge, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';
import JobCard from '@/components/ui/JobCard';
import ProjectCard from '@/components/ui/ProjectCard';
import { Clock, ListChecks } from '@/components/ui/icons';
import s from './dashboard.module.css';

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
            <div className="card-grid">
              {data.projects.map((p) => {
                const pct = (p.totals.committedHours / (p.project.availableHours || 1)) * 100;
                const facts = [
                  ...(p.counts.awaitingClient ? [{ icon: <Clock />, text: `${p.counts.awaitingClient} awaiting client` }] : []),
                  ...(p.counts.needsClarification ? [{ icon: <ListChecks />, text: `${p.counts.needsClarification} need hours` }] : []),
                  ...(p.counts.rejected ? [{ icon: <ListChecks />, text: `${p.counts.rejected} rejected` }] : []),
                  ...(p.counts.approved ? [{ icon: <ListChecks />, text: `${p.counts.approved} approved` }] : []),
                  { icon: <Clock />, text: `${p.totals.remainingHours}h left of ${p.project.availableHours}h` },
                ];
                return (
                  <ProjectCard
                    key={p.project.id}
                    title={p.project.jobTitle}
                    detail={`For ${p.clientName} · ${money(p.project.ratePerHour)}/hr, amounts before tax`}
                    facts={facts}
                    usedPercent={pct}
                    badge={p.hasBaseline ? 'In progress' : 'Signed SOW missing'}
                    footerLabel="Approved changes"
                    footerValue={money(p.totals.committedValue)}
                    href={`/freelancer/projects/${p.project.id}`}
                    cta="Open"
                  />
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
            <>
              <div className="card-grid">
                {data.openJobs.map((j) => <JobCard key={j.id} job={j} href={`/freelancer/jobs/${j.id}`} cta="View and apply" />)}
              </div>
              <p><Link href="/freelancer/jobs">See all open jobs</Link></p>
            </>
          )}
        </>
      ) : null}
    </>
  );
}
