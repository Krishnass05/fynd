'use client';
// Browse open jobs. The search box filters by words in the title, description and category; ?category= filters by domain. OWNER: Krishna.
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { listJobs } from '@/lib/api';
import { matchesAllWords } from '@/lib/search';
import { useAsync } from '@/lib/useAsync';
import { ButtonLink, EmptyState, ErrorMessage, Spinner } from '@/components/ui';
import JobCard from '@/components/ui/JobCard';

function Jobs() {
  const params = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const category = (params.get('category') ?? '').trim();
  const { data, error, loading } = useAsync(() => listJobs(), []);
  const shown = (data ?? [])
    .filter((j) => matchesAllWords(q, `${j.title} ${j.description} ${j.category ?? ''}`))
    .filter((j) => !category || j.category === category);
  const label = q || category;
  return (
    <>
      <h1>Find jobs</h1>
      {label ? <p className="muted" role="status">{shown.length} {shown.length === 1 ? 'job matches' : 'jobs match'} &quot;{label}&quot;. <ButtonLink href="/freelancer/jobs" variant="secondary">Clear search</ButtonLink></p> : null}
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      {data && shown.length === 0 ? <EmptyState>{label ? 'No job matches that search.' : 'No open jobs right now.'}</EmptyState> : null}
      <div className="card-grid">
        {shown.map((j) => <JobCard key={j.id} job={j} href={`/freelancer/jobs/${j.id}`} cta={j.status === 'open' ? 'View and apply' : 'View'} />)}
      </div>
    </>
  );
}

export default function FindJobs() {
  return <Suspense fallback={<Spinner />}><Jobs /></Suspense>;
}
