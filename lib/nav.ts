// Menu links per role. OWNER: Krishna. Fixed up front so nobody edits it and causes conflicts.
import type { Role } from './types';

export const NAV: Record<Role, Array<{ href: string; label: string }>> = {
  client: [
    { href: '/client', label: 'Dashboard' },
    { href: '/client/jobs', label: 'My jobs' },
    { href: '/client/jobs/new', label: 'Post a job' },
  ],
  freelancer: [
    { href: '/freelancer', label: 'Dashboard' },
    { href: '/freelancer/jobs', label: 'Find jobs' },
    { href: '/freelancer/profile', label: 'Profile' },
  ],
};
