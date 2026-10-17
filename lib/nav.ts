// Menu links per role. OWNER: Krishna. Fixed up front so nobody edits it and causes conflicts.
// `icon` names a glyph in components/ui/icons.tsx (the sidebar draws it; the phone menu ignores it).
import type { Role } from './types';

export type NavIcon = 'home' | 'search' | 'jobs' | 'heart' | 'plus' | 'user';
export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
}

export const NAV: Record<Role, NavItem[]> = {
  client: [
    { href: '/client', label: 'Dashboard', icon: 'home' },
    { href: '/client/freelancers', label: 'Find freelancers', icon: 'search' },
    { href: '/client/jobs', label: 'My jobs', icon: 'jobs' },
    { href: '/client/saved', label: 'Saved', icon: 'heart' },
    { href: '/client/jobs/new', label: 'Post a job', icon: 'plus' },
  ],
  freelancer: [
    { href: '/freelancer', label: 'Dashboard', icon: 'home' },
    { href: '/freelancer/jobs', label: 'Find jobs', icon: 'search' },
    { href: '/freelancer/profile', label: 'Profile', icon: 'user' },
  ],
};
