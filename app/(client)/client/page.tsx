'use client';
// Client dashboard: welcome, number tiles, recent activity, what needs the client, projects and jobs.
// Laid out like a marketplace home page. OWNER: Sanjana (look).
import Link from 'next/link';
import { getClientDashboard } from '@/lib/api';
import { initials, timeAgo } from '@/lib/format';
import type { ActivityItem } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { useUser } from '@/lib/useUser';
import CountUp from '@/components/fx/CountUp';
import { Badge, ButtonLink, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';
import JobCard from '@/components/ui/JobCard';
import ProjectCard from '@/components/ui/ProjectCard';
import { CheckSquare, ChevronRight, Clock, FileText, ListChecks } from '@/components/ui/icons';

// People get their initials; milestones and change orders get an icon.
function ActivityAvatar({ a }: { a: ActivityItem }) {
  if (a.kind === 'applicant' || a.kind === 'message') {
    return <span className="avatar-sm" aria-hidden="true">{initials(a.text.split(' applied')[0].split(' sent a message')[0])}</span>;
  }
  return <span className="avatar-sm" aria-hidden="true">{a.kind === 'milestone' ? <ListChecks size={16} /> : <CheckSquare size={16} />}</span>;
}

export default function ClientDashboard() {
  const { user } = useUser('client');
  const { data, error, loading } = useAsync(getClientDashboard, []);
  return (
    <>
      <div className="section-head">
        <div>
          <h1 style={{ marginBottom: 4 }}>{user ? `Welcome back, ${user.name}` : 'Dashboard'}</h1>
          <p className="muted" style={{ margin: 0 }}>Here is what is happening with your projects. Amounts are before tax.</p>
        </div>
        <ButtonLink href="/client/jobs/new" variant="dark">Post a job</ButtonLink>
      </div>
      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}

      {data ? (
        <>
          <section className="tiles" aria-label="Summary">
            <div className="tile2" data-tone="green"><strong><CountUp to={data.stats.activeProjects} duration={0.9} /></strong><span>Active projects</span></div>
            <div className="tile2" data-tone="pink"><strong><CountUp to={data.stats.applicantsWaiting} duration={0.9} /></strong><span>Applicants waiting</span></div>
            <div className="tile2" data-tone="blue"><strong><CountUp to={data.stats.awaitingDecision} duration={0.9} /></strong><span>Change orders to decide</span></div>
            <div className="tile2" data-tone="yellow"><strong><CountUp to={data.stats.approvedSpend} prefix={'₹'} separator="," duration={1.1} /></strong><span>Approved extra spend</span></div>
          </section>

          <div className="duo">
            <section className="panel2" aria-labelledby="activity-title">
              <h2 id="activity-title">Recent activity</h2>
              {data.activity.length === 0 ? <EmptyState>Nothing yet. Post a job to get started.</EmptyState> : (
                <ul className="activity">
                  {data.activity.map((a) => (
                    <li key={a.id}>
                      <Link href={a.href}>
                        <ActivityAvatar a={a} />
                        <span className="activity-text"><strong>{a.text}</strong><small>{a.detail}</small></span>
                        <time dateTime={a.at}>{timeAgo(a.at)}</time>
                        <ChevronRight size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel2" aria-labelledby="attention-title">
              <h2 id="attention-title">Needs your attention</h2>
              {data.attention.length === 0 ? <EmptyState>Nothing is waiting on you.</EmptyState> : (
                <ul className="activity">
                  {data.attention.map((a, i) => (
                    <li key={i}>
                      <Link href={a.href}>
                        <span className="activity-text"><strong>{a.text}</strong><small>{a.title}</small></span>
                        <Badge tone={a.kind === 'change_orders' || a.kind === 'applicants' ? 'warn' : 'neutral'}>{a.kind === 'applicants' ? 'Applicants' : a.kind === 'change_orders' ? 'Decide' : 'Waiting'}</Badge>
                        <ChevronRight size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="section-head"><h2>My projects</h2></div>
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

          <div className="section-head"><h2>My jobs</h2></div>
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
