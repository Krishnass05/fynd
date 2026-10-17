'use client';
// Browse open jobs. The search box in the top bar filters by title and description. OWNER: Krishna.
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { listJobs } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { ButtonLink, EmptyState, ErrorMessage, Spinner } from '@/components/ui';
import JobCard from '@/components/ui/JobCard';

function Jobs() {
  const q = (useSearchParams().get('q') ?? '').trim().toLowerCase();
  const { data, error, loading } = useAsync(() => listJobs(), []);
  const shown = (data ?? []).filter((j) => !q || `${j.title} ${j.description} ${j.category ?? ''}`.toLowerCase().includes(q));
  return (
    <>
      <h1>Find jobs</h1>
      {q ? <p className="muted" role="status">{shown.length} {shown.length === 1 ? 'job matches' : 'jobs match'} &quot;{q}&quot;. <ButtonLink href="/freelancer/jobs" variant="secondary">Clear search</ButtonLink></p> : null}
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      {data && shown.length === 0 ? <EmptyState>{q ? 'No job matches that search.' : 'No open jobs right now.'}</EmptyState> : null}
      <div className="card-grid">
        {shown.map((j) => <JobCard key={j.id} job={j} href={`/freelancer/jobs/${j.id}`} cta={j.status === 'open' ? 'View and apply' : 'View'} />)}
      </div>
    </>
  );
}

export default function FindJobs() {
  return <Suspense fallback={<Spinner />}><Jobs /></Suspense>;
}
