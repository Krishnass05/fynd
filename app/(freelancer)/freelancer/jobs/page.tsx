'use client';
// Browse open jobs. OWNER: Krishna.
import { listJobs } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { EmptyState, ErrorMessage, Spinner } from '@/components/ui';
import JobCard from '@/components/ui/JobCard';

export default function FindJobs() {
  const { data, error, loading } = useAsync(() => listJobs(), []);
  return (
    <>
      <h1>Find jobs</h1>
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      {data?.length === 0 ? <EmptyState>No open jobs right now.</EmptyState> : null}
      <div className="card-grid">
        {(data ?? []).map((j) => <JobCard key={j.id} job={j} href={`/freelancer/jobs/${j.id}`} cta={j.status === 'open' ? 'View and apply' : 'View'} />)}
      </div>
    </>
  );
}
