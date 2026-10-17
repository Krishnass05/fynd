// Turns a search on the public home page into the right signed-in page. Hire -> freelancer search
// (/client/freelancers), Work -> open jobs (/freelancer/jobs). If nobody is signed in on that side,
// it goes to the login page first and comes back afterwards (?next=). Search logic stays in the pages,
// so this can later point at a public search API instead. OWNER: Krishna.
import { getMe } from '@/lib/api';
import type { Destination, Intent } from './data';

export function destinationPath(intent: Intent, to: Destination = {}): string {
  const base = intent === 'hire' ? '/client/freelancers' : '/freelancer/jobs';
  const p = new URLSearchParams();
  if (to.category) p.set('category', to.category);
  if (to.q && to.q.trim()) p.set('q', to.q.trim());
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

export function freelancerProfilePath(id: string): string {
  return `/client/freelancers/${id}`;
}

export async function goTo(push: (href: string) => void, path: string): Promise<void> {
  const role = path.startsWith('/client') ? 'client' : 'freelancer';
  try {
    const me = await getMe();
    if (me.role === role) return push(path);
  } catch {
    /* not signed in */
  }
  push(`/login?role=${role}&next=${encodeURIComponent(path)}`);
}

export function goSearch(push: (href: string) => void, intent: Intent, to: Destination = {}): Promise<void> {
  return goTo(push, destinationPath(intent, to));
}
