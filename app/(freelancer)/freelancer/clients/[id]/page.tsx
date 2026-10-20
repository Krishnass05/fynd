'use client';
// A client's profile as a freelancer sees it (from a job page): company, rating, reviews, open jobs. OWNER: Krishna.
import { useParams } from 'next/navigation';
import { getClient } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import ClientProfileView from '@/components/profile/ClientProfileView';
import { ButtonLink, ErrorMessage, Spinner } from '@/components/ui';

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useAsync(() => getClient(id), [id]);
  return (
    <>
      <p><ButtonLink href="/freelancer/jobs" variant="secondary">Back to jobs</ButtonLink></p>
      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}
      {data ? <ClientProfileView data={data} own={false} jobHref={(jobId) => `/freelancer/jobs/${jobId}`} /> : null}
    </>
  );
}
