'use client';
// Start page: pick a demo role. OWNER: Krishna (look follows the Crafthire design).
// Motion: the headline reveals once (React Bits BlurText) and the role cards get a hover spotlight
// (React Bits SpotlightCard). Both respect the "reduce motion" setting.
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { listDemoUsers } from '@/lib/api';
import { setUserId } from '@/lib/session';
import type { Role } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import BlurText from '@/components/fx/BlurText';
import AppNav from '@/components/shell/AppNav';
import SpotlightCard from '@/components/fx/SpotlightCard';
import { Button, ErrorMessage, Spinner } from '@/components/ui';

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

export default function Home() {
  const router = useRouter();
  const { data, error, loading } = useAsync(listDemoUsers, []);
  const pick = (id: string, role: Role) => {
    setUserId(id);
    router.push(role === 'client' ? '/client' : '/freelancer');
  };
  return (
    <main id="main-content" className="welcome">
      <div className="inner">
        <div className="appbar-public"><AppNav /></div>
        <section className="hero">
          <h1>
            <BlurText text="Great work starts with a clear scope." trigger="load" animateBy="words" direction="top" delay={110} stepDuration={0.4} />
          </h1>
          <p>Hire a freelancer, share the SOW, and price every extra request before the work starts. All data is synthetic, and this is a workflow aid, not legal advice.</p>
        </section>
        <h2 style={{ textAlign: 'center' }}>Which describes you best?</h2>
        <ErrorMessage message={error} />
        {loading ? <Spinner /> : null}
        <div className="role-grid">
          {ROLES.map(({ role, title, text, Icon }) => (
            <SpotlightCard key={role} theme="light" className="role-card" style={CARD_STYLE} spotlightColor="var(--brand)" intensity={0.5}>
              <div className="role-tile"><Icon /></div>
              <h2>{title}</h2>
              <p>{text}</p>
              <div className="row">
                {(data ?? []).filter((u) => u.role === role).map((u) => (
                  <Button key={u.id} variant={role === 'client' ? 'primary' : 'secondary'} onClick={() => pick(u.id, role)}>
                    Continue as {u.name}
                  </Button>
                ))}
              </div>
            </SpotlightCard>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 28 }}><Link href="/demo">Run the three case checks</Link></p>
      </div>
    </main>
  );
}
