'use client';
// The frame around every signed-in page: a top navigation bar with drop-down menus (Jobs, Services),
// a search box and the user, plus the PillNav menu on phones. OWNER: Sanjana (look).
// Links come from lib/nav.ts; the Services menu comes from lib/services.ts.
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DASHBOARD, HOME, LEAD, MENUS, PROFILE, TOP_LINKS } from '@/lib/nav';
import { clearUser } from '@/lib/session';
import { SERVICES } from '@/lib/services';
import type { Role } from '@/lib/types';
import { useUser } from '@/lib/useUser';
import { ChevronRight, Search } from '@/components/ui/icons';
import AppNav from './AppNav';

const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

type MenuId = 'jobs' | 'services' | 'user';

export default function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { user } = useUser(role);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<MenuId | null>(null);
  const [domain, setDomain] = useState<number | null>(null); // the Services domain being hovered
  const navRef = useRef<HTMLElement>(null);
  const lead = LEAD[role];
  const links = TOP_LINKS[role];
  const jobsMenu = MENUS[role];
  const searchBase = role === 'client' ? '/client/freelancers' : '/freelancer/jobs';

  // Close a menu with Escape, a click elsewhere, or a page change.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    const onClick = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, []);
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => { if (open !== 'services') setDomain(null); }, [open]);

  const isHere = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // The most specific link wins, so /client/jobs/new is not also "My jobs".
  const all = [...(lead ? [lead.href] : []), ...links.map((l) => l.href), ...(jobsMenu?.items.map((i) => i.href) ?? [])];
  const current = all.filter(isHere).sort((a, b) => b.length - a.length)[0];
  const jobsActive = Boolean(jobsMenu?.items.some((i) => i.href === current));
  const servicesQuery = (value: { category?: string; q?: string }) => {
    const p = new URLSearchParams();
    if (role === 'client' && value.category) p.set('category', value.category);
    else p.set('q', value.category ?? value.q ?? '');
    return `${searchBase}?${p.toString()}`;
  };

  function search(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `${searchBase}?q=${encodeURIComponent(q.trim())}` : searchBase);
  }

  const toggle = (id: MenuId) => setOpen(id);

  return (
    <div className="shell">
      <header className="topnav" ref={navRef}>
        <div className="topnav-row">
          <Link href={HOME[role]} className="brand topnav-brand">Scope Change Desk</Link>

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

          <nav className="topnav-menu" aria-label="Main">
            {lead ? <Link href={lead.href} className="topnav-link" aria-current={lead.href === current ? 'page' : undefined}>{lead.label}</Link> : null}

            {jobsMenu ? (
            <div className="topnav-item" onMouseEnter={() => setOpen('jobs')} onMouseLeave={() => setOpen(null)}>
              <button type="button" className="topnav-link" aria-expanded={open === 'jobs'} aria-controls="menu-jobs" data-active={jobsActive || undefined} onClick={() => toggle('jobs')}>
                {jobsMenu.label}<span className="caret" aria-hidden="true" />
              </button>
              {open === 'jobs' ? (
                <div className="megamenu" id="menu-jobs">
                  <div className="mega-intro"><strong>{jobsMenu.title}</strong><span>{jobsMenu.blurb}</span></div>
                  <div className="mega-body">
                    <p className="mega-label">{jobsMenu.label.toUpperCase()}</p>
                    <ul className="mega-grid mega-grid--2">
                      {jobsMenu.items.map((i) => (
                        <li key={i.href}>
                          <Link href={i.href} onClick={() => setOpen(null)}><strong>{i.label}</strong><span>{i.detail}</span></Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
            ) : null}

            <div className="topnav-item" onMouseEnter={() => setOpen('services')} onMouseLeave={() => setOpen(null)}>
              <button type="button" className="topnav-link" aria-expanded={open === 'services'} aria-controls="menu-services" onClick={() => toggle('services')}>
                Services<span className="caret" aria-hidden="true" />
              </button>
              {open === 'services' ? (
                <div className="megamenu megamenu--wide" id="menu-services">
                  <div className="mega-intro">
                    <strong>Browse our services</strong>
                    <span>{role === 'client' ? 'Hover a domain to see its topics. Pick one to see the freelancers who work in it.' : 'Hover a domain to see its topics. Pick one to see open jobs in it.'}</span>
                  </div>
                  <div className="mega-body mega-split">
                    <div>
                      <p className="mega-label">DOMAINS</p>
                      <ul className="mega-domains" onMouseLeave={() => setDomain(null)}>
                        {SERVICES.map((d, i) => (
                          <li key={d.name}>
                            <Link
                              href={servicesQuery({ category: d.name })}
                              className="mega-domain-link"
                              aria-current={domain === i ? 'true' : undefined}
                              onMouseEnter={() => setDomain(i)}
                              onFocus={() => setDomain(i)}
                              onClick={() => setOpen(null)}
                            >
                              {d.name}<ChevronRight size={14} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {domain !== null ? (
                      <div className="mega-topics" aria-label={`Topics in ${SERVICES[domain].name}`}>
                        <p className="mega-label">TOPICS</p>
                        <ul>
                          {SERVICES[domain].topics.map((t) => (
                            <li key={t}><Link href={servicesQuery({ q: t })} onClick={() => setOpen(null)}>{t}</Link></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {links.map((l) => (
              <Link key={l.href} href={l.href} className="topnav-link" aria-current={l.href === current ? 'page' : undefined}>{l.label}</Link>
            ))}
          </nav>

          <div className="usermenu">
            <span className="usermenu-name"><small>Hello,</small>{user ? user.name : ''}</span>
            <div className="usermenu-wrap" onMouseEnter={() => setOpen('user')} onMouseLeave={() => setOpen(null)}>
              <button type="button" className="avatar avatar-link" aria-label="Open your account menu" aria-haspopup="menu" aria-expanded={open === 'user'} aria-controls="menu-user" data-here={pathname.startsWith(PROFILE[role]) || pathname.startsWith(DASHBOARD[role]) || undefined} onClick={() => toggle('user')}>
                {user ? initials(user.name) : ''}
              </button>
              {open === 'user' ? (
                <div className="usermenu-panel" id="menu-user" role="menu" aria-label="Account">
                  <Link href={PROFILE[role]} role="menuitem" onClick={() => setOpen(null)}>Profile</Link>
                  <Link href={DASHBOARD[role]} role="menuitem" onClick={() => setOpen(null)}>Dashboard</Link>
                  <button type="button" role="menuitem" onClick={() => { clearUser(); router.push('/login'); }}>Log out</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mobilebar"><AppNav role={role} /></div>
      </header>
      <main id="main-content" className="page">{children}</main>
    </div>
  );
}
