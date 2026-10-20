'use client';
// A client's profile: who they are, company details, rating and reviews, and what they have posted.
// Shown to the client (their own page) and to freelancers (from a job page). OWNER: Krishna.
import Link from 'next/link';
import { initials } from '@/lib/format';
import type { ClientProfile } from '@/lib/types';
import { Badge } from '@/components/ui';
import { RatingSummary, ReviewList, SampleNote } from './Parts';

export default function ClientProfileView({ data, own, jobHref }: { data: ClientProfile; own: boolean; jobHref: (jobId: string) => string }) {
  const c = data.company;
  return (
    <>
      <section className="profilecard" aria-labelledby="profile-title">
        <span className="avatar-xl" aria-hidden="true">{initials(c?.name ?? data.name)}</span>
        <div className="profilecard-main">
          <h1 id="profile-title">{c?.name ?? data.name}</h1>
          <p style={{ margin: '0 0 8px' }}>{own ? `${data.name} (you)` : `Posted by ${data.name}`}</p>
          <Badge tone="neutral">Client</Badge>
        </div>
        <RatingSummary rating={data.rating} count={data.reviewCount} label="sample" />
        <dl className="profile-facts">
          <div><dt>Name</dt><dd>{data.name}</dd></div>
          {own ? <div><dt>Email</dt><dd>{data.email ?? 'Not given'}</dd></div> : null}
          <div><dt>Account type</dt><dd>Client (hires freelancers)</dd></div>
          {c ? (
            <>
              <div><dt>Company</dt><dd>{c.name}</dd></div>
              <div><dt>Industry</dt><dd>{c.industry || 'Not set'}</dd></div>
              <div><dt>Company size</dt><dd>{c.size || 'Not set'}</dd></div>
              <div><dt>Location</dt><dd>{c.location || 'Not set'}</dd></div>
              <div><dt>Website</dt><dd>{c.website || 'Not set'}</dd></div>
              <div><dt>Member since</dt><dd>{c.memberSince}</dd></div>
            </>
          ) : null}
        </dl>
      </section>

      {c ? (
        <>
          <h2 style={{ marginTop: 0 }}>About the company</h2>
          <p>{c.about || 'No description yet.'}</p>
        </>
      ) : <p className="muted">No company details were given.</p>}

      <div className="statrow">
        <div><strong>{data.stats.jobsPosted}</strong><span>Jobs posted</span></div>
        <div><strong>{data.stats.hires}</strong><span>Freelancers hired</span></div>
        <div><strong>{data.stats.openJobs}</strong><span>Open jobs now</span></div>
        <div><strong>{data.rating ? data.rating.toFixed(1) : '-'}</strong><span>Rating (sample)</span></div>
      </div>

      {data.openJobs.length ? (
        <>
          <h2>Open jobs</h2>
          <ul className="openjobs">
            {data.openJobs.map((j) => <li key={j.id}><Link href={jobHref(j.id)}>{j.title}</Link></li>)}
          </ul>
        </>
      ) : null}

      <h2>Reviews from freelancers</h2>
      <ReviewList reviews={data.reviews} empty="No reviews yet." />
      <SampleNote>Company details, ratings and reviews are made-up sample content for the demo, not real people.</SampleNote>
    </>
  );
}

