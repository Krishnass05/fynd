'use client';
// Landing page and demo login. OWNER: Krishna (look follows the marketplace mock).
// The numbers come from our own data: no made-up user counts.
import type { CSSProperties } from 'react';
import { getSiteStats, listDemoUsers } from '@/lib/api';
import type { Role } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import BlurText from '@/components/fx/BlurText';
import SpotlightCard from '@/components/fx/SpotlightCard';
import AppNav from '@/components/shell/AppNav';
import { ButtonLink, ErrorMessage, Spinner } from '@/components/ui';
import { ArrowRight } from '@/components/ui/icons';

const Briefcase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="14" x="2" y="7" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const Laptop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
  </svg>
);

const ROLES: Array<{ role: Role; title: string; text: string; Icon: () => React.JSX.Element }> = [
  { role: 'client', title: 'Client', text: 'Post jobs, hire, and approve every extra request', Icon: Briefcase },
  { role: 'freelancer', title: 'Freelancer', text: 'Find jobs, send proposals, and get scope changes in writing', Icon: Laptop },
];

// Flat look: the card draws its own thin border, so the shadow and surface come from our tokens.
const CARD_STYLE = { '--spotlight-card-surface': 'var(--card)', '--spotlight-card-shadow': 'none' } as CSSProperties;

// A picture of the product's main idea: an extra request, priced before any work starts.
function Collage() {
  return (
    <div className="collage" aria-hidden="true">
      <span className="blk b1" />
      <span className="blk b2" />
      <span className="blk b3" />
      <div className="main">
        <h3>Change order: Payment checkout</h3>
        <div className="line"><span>Signed SOW says</span><span>excluded</span></div>
        <div className="line"><span>6 hours at {'₹'}1,000</span><span>before tax</span></div>
        <p className="price">{'₹'}6,000</p>
        <span className="flag">Needs the client&apos;s approval</span>
      </div>
      <div className="float"><strong>Rejected means not booked</strong>Nothing counts as work until it is approved.</div>
    </div>
  );
}

export default function Home() {
  const users = useAsync(listDemoUsers, []);
  const stats = useAsync(getSiteStats, []);
  return (
    <main id="main-content" className="welcome">
      <div className="inner">
        <div className="appbar-public"><AppNav /></div>

        <section className="hero2">
          <div>
            <p className="eyebrow">The freelance marketplace with clear scope</p>
            <h1>
              <BlurText text="Hire talent. Get work done." trigger="load" animateBy="words" direction="top" delay={110} stepDuration={0.4} />
            </h1>
            <p className="lead">Connect with skilled freelancers across design, development, writing, marketing and more. Every extra request is priced and approved before the work starts.</p>
            <div className="cta">
              <ButtonLink href="#start" variant="dark">Find talent <ArrowRight size={18} /></ButtonLink>
              <ButtonLink href="#start" variant="secondary">Post a project</ButtonLink>
            </div>
            <div className="truth" aria-label="Facts about this demo">
              <div><strong>{stats.data ? stats.data.jobProfiles : '-'}</strong><span>job profiles with typical rates</span></div>
              <div><strong>{stats.data ? stats.data.sampleFreelancers : '-'}</strong><span>sample freelancers</span></div>
              <div><strong>{stats.data ? `${stats.data.checksPassed} of ${stats.data.checksTotal}` : '-'}</strong><span>case checks passing</span></div>
            </div>
          </div>
          <Collage />
        </section>

        <section id="start" aria-labelledby="start-title">
          <h2 id="start-title" style={{ textAlign: 'center' }}>Which describes you best?</h2>
          <p className="muted" style={{ textAlign: 'center' }}>All data is synthetic, and this is a workflow aid, not legal advice.</p>
          <ErrorMessage message={users.error} />
          {users.loading ? <Spinner /> : null}
          <div className="role-grid">
            {ROLES.map(({ role, title, text }) => (
              <SpotlightCard key={role} theme="light" className={`role-card role-card--${role}`} style={CARD_STYLE} spotlightColor="var(--brand)" intensity={0.5}>
                <div className="role-tile" data-role={role} aria-hidden="true" />
                <h2>{title}</h2>
                <p>{text}</p>
                <div className="row">
                  <ButtonLink href={`/login?role=${role}`}>Log in as {role}</ButtonLink>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
