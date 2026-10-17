'use client';
// The navigation bar used on every page: React Bits PillNav in our colours. OWNER: Sanjana (look).
// It highlights the page you are on, uses Next links (no full reload), and folds into a menu button on narrow screens.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PillNav from '@/components/fx/PillNav';
import { HOME, NAV } from '@/lib/nav';
import type { Role } from '@/lib/types';

const PUBLIC_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Start', href: '/start' },
  { label: 'Case checks', href: '/demo' },
];

// Our palette (from joveo.com) as hex (PillNav needs hex to pick readable label colours).
const BRAND = '#403d39'; // Charcoal Brown
const INK = '#252422'; // Carbon Black

const Mark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="m8 12.5 3 3 5-6" />
  </svg>
);

export default function AppNav({ role }: { role?: Role }) {
  const pathname = usePathname() ?? '';
  const items = role ? NAV[role] : PUBLIC_ITEMS;
  // The most specific link wins: /client/jobs/new is "Post a job", not "My jobs".
  const best = items
    .filter((i) => pathname === i.href || (i.href !== '/' && pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <PillNav
      logo={<Mark />}
      logoAlt="Scope Change Desk, home"
      logoHref={role ? HOME[role] : '/'}
      items={items.map(({ label, href }) => ({ label, href }))}
      activeHref={best?.href ?? ''}
      linkComponent={Link}
      theme="light"
      surface="solid"
      barColor="#ffffff"
      textColor={INK}
      highlightColor={BRAND}
      itemStyle="pill"
      hoverEffect="fill"
      indicator="dot"
      size="md"
      ariaLabel="Main"
    />
  );
}
