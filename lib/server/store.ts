// In-memory data store with seed data. OWNER: Krishna.
// This is the ONLY file that knows where data lives. Supabase replaces it later; nothing else changes.
import { ScopeDesk } from '@/lib/engine/scopeDesk';
import fixture from '../../fixture.json';
import type { Application, CompareLabel, Job, Message, Project, SowDocument, User } from '@/lib/types';

export interface Db {
  users: User[];
  jobs: Job[];
  applications: Application[];
  projects: Project[];
  sow: SowDocument[];
  messages: Message[];
  desks: Map<string, ScopeDesk>;
  labels: Map<string, Record<string, CompareLabel>>;
  hashes: Map<string, string>; // projectId:sha256(text) -> sow document id, to ignore repeat uploads
  seq: number;
}

const NOW = '2026-10-17T10:00:00.000Z';

function seed(): Db {
  const users: User[] = [
    { id: 'u_client1', name: 'Demo Client', role: 'client', skills: [] },
    { id: 'u_freelancer1', name: 'Demo Freelancer', role: 'freelancer', skills: ['Web design', 'WordPress'] },
    { id: 'u_freelancer2', name: 'Second Freelancer', role: 'freelancer', skills: ['Logo design', 'Illustration'] },
  ];
  const jobs: Job[] = [
    { id: 'J1', clientId: 'u_client1', title: 'Landing page for a small shop', description: 'One landing page and a contact form for a neighbourhood shop.', budget: 12000, deadline: '2026-11-10', status: 'in_progress', createdAt: NOW },
    { id: 'J2', clientId: 'u_client1', title: 'Logo for a new cafe', description: 'A simple logo with colour and black-and-white versions.', budget: 9000, deadline: '2026-11-20', status: 'open', createdAt: NOW },
  ];
  const applications: Application[] = [
    { id: 'A1', jobId: 'J1', freelancerId: 'u_freelancer1', freelancerName: 'Demo Freelancer', pitch: 'I can deliver this in two weeks.', proposedPrice: 12000, status: 'accepted', createdAt: NOW },
    { id: 'A3', jobId: 'J2', freelancerId: 'u_freelancer1', freelancerName: 'Demo Freelancer', pitch: 'Clean, quick logo work with two revision rounds included.', proposedPrice: 8000, status: 'pending', createdAt: NOW },
    { id: 'A2', jobId: 'J2', freelancerId: 'u_freelancer2', freelancerName: 'Second Freelancer', pitch: 'I have designed several cafe logos.', proposedPrice: 9000, status: 'pending', createdAt: NOW },
  ];
  const projects: Project[] = [
    { id: 'P1', jobId: 'J1', jobTitle: 'Landing page for a small shop', clientId: 'u_client1', freelancerId: 'u_freelancer1', ratePerHour: fixture.ratePerHour, availableHours: fixture.availableHours, currency: 'INR', createdAt: NOW },
  ];
  const sow: SowDocument[] = [
    {
      id: 'S1', projectId: 'P1', version: 1, kind: 'baseline', filename: 'signed-sow.txt', uploadedBy: 'u_freelancer1', uploadedAt: NOW,
      items: [
        { section: 'deliverable', text: 'One landing page', hours: null },
        { section: 'deliverable', text: 'Contact form', hours: null },
        { section: 'excluded', text: 'Payment checkout', hours: null },
      ],
    },
  ];
  const messages: Message[] = [
    { id: 'M1', projectId: 'P1', senderId: 'u_client1', senderName: 'Demo Client', body: 'Welcome. The signed SOW is uploaded.', sentAt: NOW },
  ];
  // Project P1 starts with the case fixture so the three case checks are visible straight away.
  const desks = new Map<string, ScopeDesk>([['P1', ScopeDesk.fromFixture(fixture)]]);
  const labels = new Map<string, Record<string, CompareLabel>>([['P1', {}]]);
  return { users, jobs, applications, projects, sow, messages, desks, labels, hashes: new Map(), seq: 100 };
}

const g = globalThis as unknown as { __scopeDeskDb?: Db };

export function db(): Db {
  if (!g.__scopeDeskDb) g.__scopeDeskDb = seed();
  return g.__scopeDeskDb;
}

export function resetDb(): void {
  g.__scopeDeskDb = seed();
}

export function nextId(prefix: string): string {
  const d = db();
  d.seq += 1;
  return `${prefix}${d.seq}`;
}
