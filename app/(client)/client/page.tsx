'use client';
// Client dashboard. OWNER: Sanjana. Starter version: replace with the final design.
import { getProject, listJobs, listProjects } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useUser } from '@/lib/useUser';
import { EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';
import JobCard from '@/components/ui/JobCard';
import ProjectCard from '@/components/ui/ProjectCard';
import { Clock, FileText, ListChecks } from '@/components/ui/icons';

export default function ClientDashboard() {
  useUser('client');
  const jobs = useAsync(() => listJobs({ mine: true }), []);
  const projects = useAsync(async () => Promise.all((await listProjects()).map((p) => getProject(p.id))), []);
  return (
    <>
      <h1>Client dashboard</h1>
      <ErrorMessage message={jobs.error ?? projects.error} />
      {jobs.loading || projects.loading ? <Spinner /> : null}

      <h2>My projects</h2>
      {projects.data?.length === 0 ? <EmptyState>No projects yet. Accept an applicant to start one.</EmptyState> : null}
      <div className="card-grid">
        {(projects.data ?? []).map((d) => {
          const waiting = d.changeRequests.filter((c) => c.state === 'quoted').length;
          return (
            <ProjectCard
              key={d.project.id}
              title={d.project.jobTitle}
              detail={`With ${d.freelancer.name} · ${money(d.project.ratePerHour)}/hr, amounts before tax`}
              facts={[
                { icon: <ListChecks />, text: `${d.changeRequests.length} change ${d.changeRequests.length === 1 ? 'order' : 'orders'}` },
                { icon: <FileText />, text: `${d.sowDocuments.length} SOW ${d.sowDocuments.length === 1 ? 'version' : 'versions'}` },
                { icon: <Clock />, text: `${d.totals.remainingHours}h left` },
              ]}
              usedPercent={d.project.availableHours ? (d.totals.committedHours / d.project.availableHours) * 100 : 0}
              footerLabel="Awaiting your decision"
              footerValue={waiting}
              href={`/client/projects/${d.project.id}`}
              cta="Open"
            />
          );
        })}
      </div>

      <h2>My jobs</h2>
      {jobs.data?.length === 0 ? <EmptyState>No jobs posted yet.</EmptyState> : null}
      <div className="card-grid">
        {(jobs.data ?? []).map((j) => <JobCard key={j.id} job={j} href={`/client/jobs/${j.id}`} cta="View" />)}
      </div>
    </>
  );
}
