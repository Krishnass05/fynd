'use client';
// Freelancer dashboard. OWNER: Krishna.
import Link from 'next/link';
import { listProjects } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useUser } from '@/lib/useUser';
import { Card, EmptyState, ErrorMessage, Spinner } from '@/components/ui';

export default function FreelancerDashboard() {
  useUser('freelancer');
  const projects = useAsync(listProjects, []);
  return (
    <>
      <h1>Freelancer dashboard</h1>
      <ErrorMessage message={projects.error} />
      {projects.loading ? <Spinner /> : null}
      <Card title="My projects">
        {projects.data?.length ? projects.data.map((p) => (
          <p key={p.id}><Link href={`/freelancer/projects/${p.id}`}>{p.jobTitle}</Link></p>
        )) : <EmptyState>No projects yet. <Link href="/freelancer/jobs">Find a job</Link> and apply.</EmptyState>}
      </Card>
    </>
  );
}
