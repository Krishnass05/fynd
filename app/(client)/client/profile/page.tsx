'use client';
// The client's own profile: details, company, rating and reviews. The dashboard has its own page. OWNER: Krishna.
import { getClient } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useUser } from '@/lib/useUser';
import ClientProfileView from '@/components/profile/ClientProfileView';
import { ErrorMessage, Spinner } from '@/components/ui';

export default function ClientProfile() {
  const { user } = useUser('client');
  const { data, error } = useAsync(() => (user ? getClient(user.id) : Promise.resolve(null)), [user?.id]);
  return (
    <>
      <ErrorMessage message={error} />
      {!data && !error ? <Spinner /> : null}
      {data ? <ClientProfileView data={data} own jobHref={(id) => `/client/jobs/${id}`} /> : null}
    </>
  );
}
