'use client';
// The frame around every signed-in page: a sidebar on wide screens, a top bar with search and the user,
// and the PillNav menu on phones. OWNER: Sanjana (look). Links come from lib/nav.ts.
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { NAV, type NavIcon } from '@/lib/nav';
import { clearUser } from '@/lib/session';
import type { Role } from '@/lib/types';
import { useUser } from '@/lib/useUser';
import { Briefcase, CheckSquare, Heart, Home, Plus, Search, User } from '@/components/ui/icons';
import AppNav from './AppNav';

const ICONS: Record<NavIcon, (p: { size?: number }) => React.JSX.Element> = {
  home: Home, search: Search, jobs: Briefcase, heart: (p) => <Heart {...p} />, plus: Plus, user: User,
};

const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { user } = useUser(role);
  const [q, setQ] = useState('');
  const items = NAV[role];
  // The most specific link wins: /client/jobs/new is "Post a job", not "My jobs".
  const active = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  function search(e: React.FormEvent) {
    e.preventDefault();
    const target = role === 'client' ? '/client/freelancers' : '/freelancer/jobs';
    router.push(q.trim() ? `${target}?q=${encodeURIComponent(q.trim())}` : target);
  }

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Sidebar">
        <Link href={`/${role}`} className="brand sidebar-brand">Scope Change Desk</Link>
        <nav aria-label="Main">
          <ul className="sidebar-list">
            {items.map((i) => {
              const Icon = ICONS[i.icon];
              return (
                <li key={i.href}>
                  <Link href={i.href} className="sidebar-link" aria-current={i.href === active ? 'page' : undefined}>
                    <Icon size={18} />{i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link href="/demo" className="sidebar-link sidebar-foot"><CheckSquare size={18} />Case checks</Link>
      </aside>

      <div className="shell-main">
        <div className="mobilebar"><AppNav role={role} /></div>
        <header className="topbar2">
          <form role="search" className="searchbox" onSubmit={search}>
            <Search size={18} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={role === 'client' ? 'Search for skills or freelancers' : 'Search for jobs'}
              aria-label={role === 'client' ? 'Search freelancers' : 'Search jobs'}
            />
          </form>
          <div className="usermenu">
            <span className="usermenu-name">{user ? `${user.name}` : ''}<small>{user ? user.role : ''}</small></span>
            <span className="avatar" aria-hidden="true">{user ? initials(user.name) : ''}</span>
            <button className="btn secondary" onClick={() => { clearUser(); router.push('/login'); }}>Switch user</button>
          </div>
        </header>
        <main id="main-content" className="page">{children}</main>
      </div>
    </div>
  );
}
