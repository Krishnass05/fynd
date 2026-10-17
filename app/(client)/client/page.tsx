'use client';
// Client dashboard: summary numbers, shortcuts, what needs the client, projects and jobs.
// Laid out like a hiring home page (post a job, your jobs, your hires). OWNER: Sanjana (look).
import Link from 'next/link';
import { getClientDashboard } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useUser } from '@/lib/useUser';
import CountUp from '@/components/fx/CountUp';
import { Badge, ButtonLink, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';
import JobCard from '@/components/ui/JobCard';
import ProjectCard from '@/components/ui/ProjectCard';
import { Clock, FileText, ListChecks } from '@/components/ui/icons';
import s from './dashboard.module.css';

// Shortcuts to each area. Features that are not built yet are shown as "Coming soon" and cannot be opened.
const SHORTCUTS: Array<{ title: string; text: string; href?: string }> = [
  { title: 'Post a job', text: 'Describe the work and get applicants', href: '/client/jobs/new' },
  { title: 'My jobs', text: 'Applicants, status and deadlines', href: '/client/jobs' },
  { title: 'Case checks', text: 'See the three scored checks run', href: '/demo' },
  { title: 'Find freelancers', text: 'Browse by category and skill' },
  { title: 'Payments', text: 'Protected payment ledger (simulated)' },
];

export default function ClientDashboard() {
  const { user } = useUser('client');
  const { data, error, loading } = useAsync(getClientDashboard, []);
  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.greeting}>{user ? `Welcome back, ${user.name}` : 'Dashboard'}</h1>
          <p className="muted">Your jobs, your hires, and what needs your decision. Amounts are before tax.</p>
        </div>
        <ButtonLink href="/client/jobs/new" variant="primary">Post a job</ButtonLink>
      </div>
      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}

      {data ? (
        <>
          <section className={s.stats} aria-label="Summary">
            <div className={s.stat}><div className={s.statValue}><CountUp to={data.stats.activeProjects} duration={0.9} /></div><div className={s.statLabel}>Active projects</div></div>
            <div className={s.stat}><div className={s.statValue}><CountUp to={data.stats.applicantsWaiting} duration={0.9} /></div><div className={s.statLabel}>Applicants waiting</div></div>
            <div className={s.stat}><div className={s.statValue}><CountUp to={data.stats.awaitingDecision} duration={0.9} /></div><div className={s.statLabel}>Change orders to decide</div></div>
            <div className={s.stat}><div className={s.statValue}><CountUp to={data.stats.approvedSpend} prefix={'₹'} separator="," duration={1.1} /></div><div className={s.statLabel}>Approved extra spend</div></div>
          </section>

          <h2>Quick actions</h2>
          <div className={s.quick}>
            {SHORTCUTS.map((t) => t.href ? (
              <Link key={t.title} href={t.href} className={s.tile}><strong>{t.title}</strong><span>{t.text}</span></Link>
            ) : (
              <div key={t.title} className={`${s.tile} ${s.soon}`} aria-disabled="true"><strong>{t.title}</strong><span>{t.text}</span><span className={s.soonTag}>Coming soon</span></div>
            ))}
          </div>

          <h2>Needs your attention</h2>
          {data.attention.length === 0 ? (
            <EmptyState>Nothing is waiting on you.</EmptyState>
          ) : (
            <ul className={s.attention}>
              {data.attention.map((a, i) => (
                <li key={i}>
                  <Badge tone={a.kind === 'change_orders' || a.kind === 'applicants' ? 'warn' : 'neutral'}>{a.title}</Badge>
                  <span>{a.text}</span>
                  <Link href={a.href}>Open</Link>
                </li>
              ))}
            </ul>
          )}

          <h2>My projects</h2>
          {data.projects.length === 0 ? <EmptyState>No projects yet. Accept an applicant to start one.</EmptyState> : null}
          <div className="card-grid">
            {data.projects.map((p) => (
              <ProjectCard
                key={p.project.id}
                title={p.project.jobTitle}
                detail={`With ${p.freelancerName} · ${money(p.project.ratePerHour)}/hr, amounts before tax`}
                badge={p.hasBaseline ? 'In progress' : 'Signed SOW missing'}
                facts={[
                  { icon: <ListChecks />, text: `${p.counts.awaitingDecision} to decide` },
                  { icon: <FileText />, text: `${p.counts.approved} approved` },
                  { icon: <Clock />, text: `${p.totals.remainingHours}h left` },
                ]}
                usedPercent={p.project.availableHours ? (p.totals.committedHours / p.project.availableHours) * 100 : 0}
                footerLabel="Approved extra spend"
                footerValue={money(p.totals.committedValue)}
                href={`/client/projects/${p.project.id}`}
                cta="Open"
                secondary={{ href: `/client/projects/${p.project.id}/milestones`, label: 'Milestones' }}
              />
            ))}
          </div>

          <h2>My jobs</h2>
          {data.jobs.length === 0 ? <EmptyState>No jobs posted yet. <Link href="/client/jobs/new">Post your first job</Link>.</EmptyState> : null}
          <div className="card-grid">
            {data.jobs.map((j) => (
              <JobCard key={j.job.id} job={j.job} href={`/client/jobs/${j.job.id}`} cta={j.pendingCount ? 'Review applicants' : 'View'} applicants={{ total: j.applicantCount, pending: j.pendingCount }} />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
