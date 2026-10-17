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
    { href: '/client/freelancers', label: 'Find freelancers', icon: 'search' },
    { href: '/client/jobs', label: 'My jobs', icon: 'jobs' },
    { href: '/client/saved', label: 'Saved', icon: 'heart' },
    { href: '/client/jobs/new', label: 'Post a job', icon: 'plus' },
    { href: '/client/profile', label: 'Profile', icon: 'user' },
  ],
  freelancer: [
    { href: '/freelancer', label: 'Dashboard', icon: 'home' },
    { href: '/freelancer/jobs', label: 'Find jobs', icon: 'search' },
    { href: '/freelancer/profile', label: 'Profile', icon: 'user' },
  ],
};

// Desktop top bar: Dashboard, then the drop-down menus, then these links.
export const TOP_LINKS: Record<Role, NavItem[]> = {
  client: [
    { href: '/client/freelancers', label: 'Find freelancers', icon: 'search' },
    { href: '/client/saved', label: 'Saved', icon: 'heart' },
  ],
  freelancer: [
    { href: '/freelancer/jobs', label: 'Find jobs', icon: 'search' },
    { href: '/freelancer/profile', label: 'Profile', icon: 'user' },
  ],
};

export interface MenuItem { href: string; label: string; detail: string }
export interface MegaMenu { label: string; title: string; blurb: string; items: MenuItem[] }

// The "Jobs" drop-down. Only clients have one: freelancers just have Find jobs.
export const MENUS: Record<Role, MegaMenu | null> = {
  client: {
    label: 'Jobs',
    title: 'Manage your work',
    blurb: 'Post new jobs and follow the ones you have.',
    items: [
      { href: '/client/jobs', label: 'My jobs', detail: 'Applicants, hiring and your projects' },
      { href: '/client/jobs/new', label: 'Post a job', detail: 'Describe the work and set a budget' },
    ],
  },
  freelancer: null,
};

// Where each side opens after login and where the logo goes. The client dashboard is not the first
// page: it sits under the client's profile (the avatar in the top bar).
export const HOME: Record<Role, string> = { client: '/client/freelancers', freelancer: '/freelancer' };
export const PROFILE: Record<Role, string> = { client: '/client/profile', freelancer: '/freelancer/profile' };
// The link before the drop-down menus in the desktop top bar (clients have none).
export const LEAD: Record<Role, NavItem | null> = { client: null, freelancer: { href: '/freelancer', label: 'Dashboard', icon: 'home' } };
