'use client';
// Top bar with brand logo, nav tabs, freemium call badge, and quick role switcher.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCallCount, isProSubscribed } from '@/lib/subscription';
import { setUserId } from '@/lib/session';
import type { Role } from '@/lib/types';
import { useUser } from '@/lib/useUser';

export default function TopBar({ role }: { role: Role }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser(role);

  const [callCount, setCallCountState] = useState(0);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    function syncState() {
      setCallCountState(getCallCount());
      setSubscribed(isProSubscribed());
    }
    syncState();
    window.addEventListener('scopedesk_subscription_updated', syncState);
    return () => window.removeEventListener('scopedesk_subscription_updated', syncState);
  }, []);

  const callsLeft = Math.max(0, 5 - callCount);

  function toggleRole() {
    if (role === 'freelancer') {
      setUserId('u_client1');
      router.push('/client');
    } else {
      setUserId('u_freelancer1');
      router.push('/freelancer');
    }
  }

  const isFreelancer = role === 'freelancer';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Link href={isFreelancer ? '/freelancer' : '/client'} className="brand-link">
          <span className="brand">Fynd ScopeDesk</span>
        </Link>

        <nav aria-label="Main Navigation">
          {isFreelancer ? (
            <>
              <Link
                href="/freelancer"
                className={pathname === '/freelancer' ? 'active' : ''}
              >
                Dashboard
              </Link>
              <Link
                href="/freelancer/jobs"
                className={pathname.startsWith('/freelancer/jobs') ? 'active' : ''}
              >
                Jobs
              </Link>
              <Link
                href="/freelancer/profile"
                className={pathname === '/freelancer/profile' ? 'active' : ''}
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link href="/client" className={pathname === '/client' ? 'active' : ''}>
                Dashboard
              </Link>
              <Link href="/client/jobs" className={pathname.startsWith('/client/jobs') ? 'active' : ''}>
                My Jobs
              </Link>
              <Link href="/client/jobs/new" className={pathname === '/client/jobs/new' ? 'active' : ''}>
                Post Job
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="topbar-right">
        <span
          className="muted"
          style={{
            background: 'var(--seashell)',
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--line)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--space-indigo)',
          }}
        >
          {isFreelancer ? (user?.name ? `${user.name} (Freelancer)` : 'Harini (Freelancer)') : 'Client_A (Client)'}
        </span>

        {/* Quick Role Switcher */}
        <button
          type="button"
          className="btn secondary pill-sm"
          onClick={toggleRole}
          title={`Switch view to ${isFreelancer ? 'Client' : 'Freelancer'}`}
        >
          ⇄ Switch to {isFreelancer ? 'Client' : 'Freelancer'}
        </button>
      </div>
    </header>
  );
}
