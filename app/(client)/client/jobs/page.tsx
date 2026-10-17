'use client';
// My jobs list. OWNER: Sanjana. Starter version: replace with the final design.
import { listJobs } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { ButtonLink, EmptyState, ErrorMessage, Spinner } from '@/components/ui';
import JobCard from '@/components/ui/JobCard';

export default function MyJobs() {
  const { data, error, loading } = useAsync(() => listJobs({ mine: true }), []);
  return (
    <>
      <h1>My jobs</h1>
      <p><ButtonLink href="/client/jobs/new" variant="primary">Post a job</ButtonLink></p>
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      {data?.length === 0 ? <EmptyState>You have not posted any jobs yet.</EmptyState> : null}
      <div className="card-grid">
        {(data ?? []).map((j) => <JobCard key={j.id} job={j} href={`/client/jobs/${j.id}`} cta="View applicants" />)}
      </div>
    </>
  );
}
