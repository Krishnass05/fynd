'use client';
// Client dashboard. OWNER: Sanjana. Starter version: replace with the final design.
import Link from 'next/link';
import { listJobs, listProjects } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useUser } from '@/lib/useUser';
import { Badge, Card, EmptyState, ErrorMessage, Spinner } from '@/components/ui';

export default function ClientDashboard() {
  useUser('client');
  const jobs = useAsync(() => listJobs({ mine: true }), []);
  const projects = useAsync(listProjects, []);
  return (
    <>
      <h1>Client dashboard</h1>
      <ErrorMessage message={jobs.error ?? projects.error} />
      {jobs.loading || projects.loading ? <Spinner /> : null}
      <Card title="My projects">
        {projects.data?.length ? projects.data.map((p) => (
          <p key={p.id}><Link href={`/client/projects/${p.id}`}>{p.jobTitle}</Link></p>
        )) : <EmptyState>No projects yet. Accept an applicant to start one.</EmptyState>}
      </Card>
      <Card title="My jobs">
        {jobs.data?.length ? jobs.data.map((j) => (
          <p key={j.id}><Link href={`/client/jobs/${j.id}`}>{j.title}</Link> <Badge>{j.status.replace('_', ' ')}</Badge></p>
        )) : <EmptyState>No jobs posted yet.</EmptyState>}
      </Card>
    </>
  );
}
