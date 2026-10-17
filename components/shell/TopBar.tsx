'use client';
// Top bar for the client and freelancer sides: the PillNav on the left, who you are and "Switch user" on the right.
// OWNER: Sanjana (look). The links come from lib/nav.ts.
import { useRouter } from 'next/navigation';
import { clearUser } from '@/lib/session';
import type { Role } from '@/lib/types';
import { useUser } from '@/lib/useUser';
import AppNav from './AppNav';

export default function TopBar({ role }: { role: Role }) {
  const router = useRouter();
  const { user } = useUser(role);
  return (
    <header className="appbar">
      <div className="appbar-nav"><AppNav role={role} /></div>
      <div className="appbar-user">
        <span className="muted">{user ? `${user.name} (${user.role})` : ''}</span>
        <button className="btn secondary" onClick={() => { clearUser(); router.push('/'); }}>Switch user</button>
      </div>
    </header>
  );
}
