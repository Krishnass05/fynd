'use client';
// Top bar with role menu. OWNER: Sanjana (look). The links come from lib/nav.ts.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NAV } from '@/lib/nav';
import { clearUser } from '@/lib/session';
import type { Role } from '@/lib/types';
import { useUser } from '@/lib/useUser';

export default function TopBar({ role }: { role: Role }) {
  const router = useRouter();
  const { user } = useUser(role);
  return (
    <header className="topbar">
      <Link href="/" className="brand">Scope Change Desk</Link>
      <nav aria-label="Main">
        {NAV[role].map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
      </nav>
      <span className="muted">{user ? `${user.name} (${user.role})` : ''}</span>
      <button className="btn secondary" onClick={() => { clearUser(); router.push('/'); }}>Switch user</button>
    </header>
  );
}
