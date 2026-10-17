'use client';
// The client's profile: what they gave when they registered. The dashboard has its own page. OWNER: Krishna.
import { initials } from '@/lib/format';
import { useUser } from '@/lib/useUser';
import { Badge, Spinner } from '@/components/ui';

export default function ClientProfile() {
  const { user, loading } = useUser('client');
  if (loading && !user) return <Spinner />;
  if (!user) return null;
  return (
    <>
      <section className="profilecard" aria-labelledby="profile-title">
        <span className="avatar-xl" aria-hidden="true">{initials(user.name)}</span>
        <div className="profilecard-main">
          <h1 id="profile-title">{user.name}</h1>
          <Badge tone="neutral">Client</Badge>
        </div>
        <dl className="profile-facts">
          <div><dt>Name</dt><dd>{user.name}</dd></div>
          <div><dt>Email</dt><dd>{user.email ?? 'Not given'}</dd></div>
          <div><dt>Account type</dt><dd>Client (hires freelancers)</dd></div>
          <div><dt>Account</dt><dd>Demo account, synthetic data</dd></div>
        </dl>
      </section>
    </>
  );
}
