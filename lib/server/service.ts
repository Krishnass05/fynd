// Business operations with role checks. OWNER: Krishna.
// Money rules live in lib/engine (plain JS, tested). This file wires people, jobs and projects to it.
import crypto from 'node:crypto';
import { ConflictError, ScopeDesk, ValidationError } from '@/lib/engine/scopeDesk';
import type { EngineView } from '@/lib/engine/scopeDesk';
import type {
  ActivityItem, Application, AttentionItem, CallMode, CallSignal, CallSignalType, CaptionResult, Freelancer, FreelancerProfile, FreelancerSearch, ChangeRequest, ClientAttentionItem, ClientDashboard, ClientProfile, ClientDashboardProject, DashboardProject, DemoResult, Flag, FreelancerDashboard, Job, JobDetail,
  JobStatus, Message, Role, MilestoneSummary, SiteStats, Project, ProjectDetail, SowDocument, SowKind, UploadSowResult, User,
} from '@/lib/types';
import { runDemo } from '@/lib/engine/demo';
import { bad, conflict, forbidden, notFound } from './errors';
import { matchesAllWords } from '@/lib/search';
import { COMPANIES, PORTFOLIO, REVIEWS } from '@/lib/data/sampleProfiles';
import { requestRole } from './context';
import { inspectSpeech, scrub } from '@/lib/engine/guard';
import { parseSow, compareSow } from '@/lib/engine/sow';
import { checkSplit, defaultSplit } from '@/lib/milestones';
import type { MilestoneDraft } from '@/lib/milestones';
import { findProfile, library } from './library';
import { db, nextId, nextSeq } from './store';

const nowIso = () => new Date().toISOString();
const str = (v: unknown, name: string, max: number): string => {
  if (typeof v !== 'string' || !v.trim()) throw bad(`${name} is required`);
  if (v.trim().length > max) throw bad(`${name} is too long (maximum ${max} characters)`);
  return v.trim();
};
const num = (v: unknown, name: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) throw bad(`${name} must be a number above 0`);
  return v;
};

const wholeRupees = (v: unknown, name: string): number => {
  const n = num(v, name);
  if (!Number.isInteger(n)) throw bad(`${name} must be a whole number of rupees`);
  return n;
};

export function actor(userId: string | null): User {
  const u = db().users.find((x) => x.id === userId);
  if (!u) throw forbidden('Choose a role first (Continue as Client or Freelancer)');
  // One account with both roles acts as the side named in the request (x-demo-role).
  const want = requestRole.getStore()?.role;
  if (want && want !== u.role && u.roles?.includes(want as Role)) return { ...u, role: want as Role };
  return u;
}

const isFreelancer = (x: User) => x.role === 'freelancer' || Boolean(x.roles?.includes('freelancer'));
const isClient = (x: User) => x.role === 'client' || Boolean(x.roles?.includes('client'));

// The start page offers only the demo users; the other freelancers exist to be browsed.
export const listUsers = (): User[] => db().users.filter((u) => u.demo);

// Demo sign-in. Real accounts (Supabase Auth) replace this later. The accounts and the shared
// password are synthetic and shown on the login page on purpose.
export const DEMO_PASSWORD = 'demo1234';
export const DEMO_LOGINS: Record<string, string> = {
  'client@demo.test': 'u_client1',
  'freelancer@demo.test': 'u_freelancer1',
  'freelancer2@demo.test': 'u_freelancer2',
  'both@demo.test': 'u_both1', // one account, both sides
};

export function login(body: Record<string, unknown>): User {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = body.role;
  if (!email) throw bad('Enter your email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('That does not look like an email address');
  if (!password) throw bad('Enter your password');
  if (role !== 'client' && role !== 'freelancer') throw bad('Choose Client or Freelancer');
  const id = DEMO_LOGINS[email];
  const user = id ? db().users.find((u) => u.id === id) : undefined;
  if (!user || password !== DEMO_PASSWORD) throw forbidden('Email or password is wrong');
  const sides: Role[] = user.roles ?? [user.role];
  if (!sides.includes(role)) throw forbidden(`This is a ${user.role} account. Choose ${user.role === 'client' ? 'Client' : 'Freelancer'} above.`);
  return { ...user, role };
}

export function updateMe(acting: User, body: Record<string, unknown>): User {
  const u = db().users.find((x) => x.id === acting.id) ?? acting; // the stored account, so changes are kept
  const side = acting.role;
  if (body.name !== undefined) u.name = str(body.name, 'name', 80);
  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills) || body.skills.some((s) => typeof s !== 'string' || !s.trim())) throw bad('skills must be a list of words');
    if (body.skills.length > 10) throw bad('At most 10 skills');
    u.skills = (body.skills as string[]).map((s) => s.trim());
  }
  if (side === 'freelancer') {
    if (body.headline !== undefined) u.headline = str(body.headline, 'headline', 120);
    if (body.overview !== undefined) u.overview = str(body.overview, 'overview', 1000);
    if (body.location !== undefined) u.location = str(body.location, 'location', 60);
    if (body.ratePerHour !== undefined && body.ratePerHour !== null && body.ratePerHour !== '') u.ratePerHour = wholeRupees(body.ratePerHour, 'ratePerHour');
  }
  return { ...u, role: side };
}

// ---- browsing freelancers (client side) ----
// Ratings come from the (sample) reviews when there are any.
const reviewsFor = (id: string, from: Role) => REVIEWS.filter((r) => r.toId === id && r.fromRole === from).sort((a, b) => b.date.localeCompare(a.date));
const averageOf = (list: Array<{ rating: number }>): number | null => (list.length ? Math.round((list.reduce((t, r) => t + r.rating, 0) / list.length) * 10) / 10 : null);

const toFreelancer = (u: User, viewer?: User): Freelancer => ({
  id: u.id, name: u.name, headline: u.headline ?? '', location: u.location ?? '', ratePerHour: u.ratePerHour ?? null,
  category: u.category ?? 'Other', availability: u.availability ?? 'available', rating: averageOf(reviewsFor(u.id, 'client')) ?? u.rating ?? null, reviewCount: reviewsFor(u.id, 'client').length, jobsDone: u.jobsDone ?? 0, skills: u.skills,
  saved: viewer ? (db().saved.get(viewer.id)?.has(u.id) ?? false) : undefined,
});

export function searchFreelancers(u: User, params: URLSearchParams): FreelancerSearch {
  if (u.role !== 'client') throw forbidden('Only clients browse freelancers');
  const all = db().users.filter(isFreelancer).map((x) => toFreelancer(x, u));
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const category = params.get('category') ?? '';
  const skill = (params.get('skill') ?? '').toLowerCase();
  const maxRateRaw = params.get('maxRate');
  const maxRate = maxRateRaw ? Number(maxRateRaw) : null;
  if (maxRate !== null && (!Number.isFinite(maxRate) || maxRate <= 0)) throw bad('maxRate must be a number above 0');
  const available = params.get('available') === '1';
  const found = all
    .filter((f) => matchesAllWords(q, [f.name, f.headline, db().users.find((x) => x.id === f.id)?.overview ?? '', f.location, f.category, ...f.skills].join(' ')))
    .filter((f) => !category || f.category === category)
    .filter((f) => !skill || f.skills.some((s) => s.toLowerCase() === skill))
    .filter((f) => maxRate === null || (f.ratePerHour !== null && f.ratePerHour <= maxRate))
    .filter((f) => !available || f.availability === 'available')
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.jobsDone - a.jobsDone);
  return {
    freelancers: found,
    categories: [...new Set(all.map((f) => f.category))].sort(),
    skills: [...new Set(all.flatMap((f) => f.skills))].sort((a, b) => a.localeCompare(b)),
  };
}

export function getFreelancerProfile(u: User, id: string): FreelancerProfile {
  const f = db().users.find((x) => x.id === id && isFreelancer(x));
  if (!f) throw notFound('Freelancer not found');
  const projects = db().projects.filter((p) => p.freelancerId === id).map((p) => ({ title: p.jobTitle, status: (db().jobs.find((j) => j.id === p.jobId)?.status ?? 'in_progress') as JobStatus }));
  const portfolio = PORTFOLIO[id] ?? [];
  const reviews = reviewsFor(id, 'client');
  const workedWith = [...new Set([...portfolio.map((p) => p.clientName), ...reviews.map((r) => r.fromCompany).filter((c): c is string => Boolean(c))])];
  return { ...toFreelancer(f, u.role === 'client' ? u : undefined), overview: f.overview ?? '', projects, portfolio, workedWith, reviews, reviewCount: reviews.length };
}

// A client's profile: company details, rating and reviews, and what they have posted. Any signed-in user can view it.
export function getClientProfile(u: User, id: string): ClientProfile {
  const c = db().users.find((x) => x.id === id && isClient(x));
  if (!c) throw notFound('Client not found');
  const jobs = db().jobs.filter((j) => j.clientId === id);
  const reviews = reviewsFor(id, 'freelancer');
  const open = jobs.filter((j) => j.status === 'open');
  return {
    id: c.id, name: c.name, email: u.id === c.id ? c.email : undefined, company: COMPANIES[id] ?? null,
    rating: averageOf(reviews), reviewCount: reviews.length, reviews,
    stats: { jobsPosted: jobs.length, hires: db().projects.filter((p) => p.clientId === id).length, openJobs: open.length },
    openJobs: open.slice(0, 5).map((j) => ({ id: j.id, title: j.title })),
  };
}

// Saved freelancers (a client's shortlist).
export function listSaved(u: User): Freelancer[] {
  if (u.role !== 'client') throw forbidden('Only clients save freelancers');
  const ids = db().saved.get(u.id) ?? new Set<string>();
  return db().users.filter((x) => isFreelancer(x) && ids.has(x.id)).map((x) => toFreelancer(x, u));
}

export function setSaved(u: User, freelancerId: string, saved: unknown): { saved: boolean } {
  if (u.role !== 'client') throw forbidden('Only clients save freelancers');
  if (typeof saved !== 'boolean') throw bad('saved must be true or false');
  const f = db().users.find((x) => x.id === freelancerId && isFreelancer(x));
  if (!f) throw notFound('Freelancer not found');
  const set = db().saved.get(u.id) ?? new Set<string>();
  if (saved) set.add(freelancerId); else set.delete(freelancerId);
  db().saved.set(u.id, set);
  return { saved };
}

// ---- jobs ----
export function listJobs(u: User, mine: boolean, status: string | null): Job[] {
  let jobs = db().jobs;
  if (u.role === 'client' && mine) jobs = jobs.filter((j) => j.clientId === u.id);
  if (u.role === 'freelancer') jobs = jobs.filter((j) => j.status === 'open' || hasApplied(u, j.id));
  if (status) jobs = jobs.filter((j) => j.status === (status as JobStatus));
  return [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const hasApplied = (u: User, jobId: string) => db().applications.some((a) => a.jobId === jobId && a.freelancerId === u.id);

export function createJob(u: User, b: Record<string, unknown>): Job {
  if (u.role !== 'client') throw forbidden('Only a client can post a job');
  const deadline = str(b.deadline, 'deadline', 20);
  if (Number.isNaN(Date.parse(deadline))) throw bad('deadline must be a date like 2026-11-10');
  let profileId: string | undefined;
  let category: string | undefined;
  if (b.profileId !== undefined && b.profileId !== '') {
    const prof = typeof b.profileId === 'string' ? findProfile(b.profileId) : undefined;
    if (!prof) throw bad('Unknown job profile');
    profileId = prof.id;
    category = prof.category;
  }
  const job: Job = {
    id: nextId('J'), clientId: u.id, profileId, category, title: str(b.title, 'title', 120), description: str(b.description, 'description', 2000),
    budget: num(b.budget, 'budget'), deadline, status: 'open', createdAt: nowIso(),
  };
  db().jobs.push(job);
  return job;
}

export function getJob(u: User, id: string): JobDetail {
  const job = db().jobs.find((j) => j.id === id);
  if (!job) throw notFound('Job not found');
  if (u.role === 'client' && job.clientId !== u.id) throw forbidden('This job belongs to another client');
  if (u.role === 'freelancer' && job.status !== 'open' && !hasApplied(u, id)) throw notFound('Job not found');
  let applications = db().applications.filter((a) => a.jobId === id);
  if (u.role === 'freelancer') applications = applications.filter((a) => a.freelancerId === u.id);
  const prof = job.profileId ? findProfile(job.profileId) : undefined;
  const typicalTotal = prof?.ratePerHour && prof.typicalHours ? prof.ratePerHour * prof.typicalHours : null;
  const withSkills = applications.map((a) => ({ ...a, freelancerSkills: db().users.find((x) => x.id === a.freelancerId)?.skills ?? [] }));
  const owner = db().users.find((x) => x.id === job.clientId);
  const ownerReviews = reviewsFor(job.clientId, 'freelancer');
  const client = { id: job.clientId, name: owner?.name ?? 'Client', company: COMPANIES[job.clientId]?.name ?? null, rating: averageOf(ownerReviews), reviewCount: ownerReviews.length };
  return { job, client, typicalTotal, applications: withSkills };
}

export function applyToJob(u: User, jobId: string, b: Record<string, unknown>): Application {
  if (u.role !== 'freelancer') throw forbidden('Only a freelancer can apply');
  const job = db().jobs.find((j) => j.id === jobId);
  if (!job) throw notFound('Job not found');
  if (job.clientId === u.id) throw forbidden('You cannot apply to your own job');
  if (job.status !== 'open') throw conflict('This job is no longer open');
  if (hasApplied(u, jobId)) throw conflict('You already applied to this job');
  const app: Application = {
    id: nextId('A'), jobId, freelancerId: u.id, freelancerName: u.name, pitch: str(b.pitch, 'pitch', 1000),
    proposedPrice: wholeRupees(b.proposedPrice, 'proposedPrice'), status: 'pending', createdAt: nowIso(),
  };
  db().applications.push(app);
  return app;
}

// The client removes an applicant they do not want. The application becomes 'rejected'; the job stays open.
export function rejectApplication(u: User, applicationId: string): { id: string; status: 'rejected' } {
  const app = db().applications.find((a) => a.id === applicationId);
  if (!app) throw notFound('Application not found');
  const job = db().jobs.find((j) => j.id === app.jobId)!;
  if (u.role !== 'client' || job.clientId !== u.id) throw forbidden('Only the client who posted the job can remove an applicant');
  if (app.status !== 'pending') throw conflict('This application was already decided');
  app.status = 'rejected';
  return { id: app.id, status: 'rejected' };
}

export function acceptApplication(u: User, applicationId: string, body: Record<string, unknown> = {}): { projectId: string } {
  const app = db().applications.find((a) => a.id === applicationId);
  if (!app) throw notFound('Application not found');
  const job = db().jobs.find((j) => j.id === app.jobId)!;
  if (u.role !== 'client' || job.clientId !== u.id) throw forbidden('Only the client who posted the job can accept');
  if (job.status !== 'open') throw conflict('This job already has an accepted freelancer');
  if (app.status !== 'pending') throw conflict('This application was already decided');
  // Split the agreed price into milestones before anything changes, so a bad split leaves everything as it was.
  let parts: MilestoneDraft[];
  if (body.milestones === undefined) {
    parts = defaultSplit(app.proposedPrice);
  } else {
    if (!Array.isArray(body.milestones)) throw bad('milestones must be a list');
    parts = (body.milestones as Array<{ title?: unknown; amount?: unknown }>).map((m) => ({
      title: typeof m?.title === 'string' ? m.title.trim() : '',
      amount: typeof m?.amount === 'number' ? m.amount : NaN,
    }));
  }
  const splitError = checkSplit(parts, app.proposedPrice);
  if (splitError) throw bad(splitError);
  for (const a of db().applications.filter((x) => x.jobId === job.id)) a.status = a.id === app.id ? 'accepted' : 'rejected';
  job.status = 'in_progress';
  const project: Project = {
    id: nextId('P'), jobId: job.id, jobTitle: job.title, clientId: job.clientId, freelancerId: app.freelancerId,
    ratePerHour: 1000, availableHours: 40, currency: 'INR', createdAt: nowIso(),
  };
  // A job started from a library profile carries that profile's typical rate and hours into the project.
  const prof = job.profileId ? findProfile(job.profileId) : undefined;
  if (prof?.ratePerHour) project.ratePerHour = prof.ratePerHour;
  if (prof?.typicalHours) project.availableHours = prof.typicalHours;
  db().projects.push(project);
  db().desks.set(project.id, new ScopeDesk({ scope: { included: [], excluded: [] }, ratePerHour: project.ratePerHour, availableHours: project.availableHours }));
  db().labels.set(project.id, {});
  for (const part of parts) {
    db().milestones.push({ id: nextId('MS'), projectId: project.id, title: part.title, amount: part.amount, status: 'pending', readyAt: null, approvedAt: null, approvedBy: null });
  }
  return { projectId: project.id };
}

// ---- projects ----
function projectFor(u: User, id: string): Project {
  const p = db().projects.find((x) => x.id === id);
  if (!p) throw notFound('Project not found');
  if (p.clientId !== u.id && p.freelancerId !== u.id) throw forbidden('You are not part of this project');
  return p;
}

export const listProjects = (u: User): Project[] => db().projects.filter((p) => p.clientId === u.id || p.freelancerId === u.id);

function toChange(projectId: string, v: EngineView): ChangeRequest {
  const label = db().labels.get(projectId)?.[v.id] ?? null;
  const flags: Flag[] = [];
  if (label === 'previously_excluded') flags.push({ code: 'previously_excluded', message: 'This was excluded in the signed SOW, so it is a paid change.' });
  if (v.hours === null) flags.push({ code: 'hours_unknown', message: 'Hours unknown, so no price until clarified.' });
  if (v.warnings.some((w) => w.startsWith('Over capacity'))) flags.push({ code: 'over_capacity', message: 'Needs more hours than remain, so approval is blocked.' });
  if (v.urgent) flags.push({ code: 'rush', message: 'Urgent request: the rush multiplier is an assumption.' });
  return { ...v, classification: v.classification as ChangeRequest['classification'], state: v.state as ChangeRequest['state'], label, flags };
}

export function getProject(u: User, id: string): ProjectDetail {
  const project = projectFor(u, id);
  const desk = db().desks.get(id)!;
  const client = db().users.find((x) => x.id === project.clientId)!;
  const freelancer = db().users.find((x) => x.id === project.freelancerId)!;
  return {
    project, client, freelancer,
    sowDocuments: db().sow.filter((s) => s.projectId === id),
    changeRequests: desk.requests().map((v) => toChange(id, v)),
    milestones: db().milestones.filter((m) => m.projectId === id),
    milestoneSummary: milestoneSummary(id),
    totals: {
      committedHours: desk.committedHours(), remainingHours: desk.remainingHours(), committedValue: desk.committedValue(),
      utilization: desk.utilization(), beforeTax: true,
    },
    audit: desk.audit(),
  };
}

// ---- milestones (record only: no money moves) ----
function milestoneSummary(projectId: string): MilestoneSummary {
  const list = db().milestones.filter((m) => m.projectId === projectId);
  const total = list.reduce((n, m) => n + m.amount, 0);
  const approved = list.filter((m) => m.status === 'approved').reduce((n, m) => n + m.amount, 0);
  return { total, approved, remaining: total - approved };
}

function milestoneFor(projectId: string, milestoneId: string) {
  const m = db().milestones.find((x) => x.id === milestoneId && x.projectId === projectId);
  if (!m) throw notFound('Milestone not found');
  return m;
}

export function markMilestoneReady(u: User, projectId: string, milestoneId: string): ProjectDetail {
  projectFor(u, projectId);
  if (u.role !== 'freelancer') throw forbidden('Only the freelancer marks a milestone ready');
  const m = milestoneFor(projectId, milestoneId);
  if (m.status !== 'pending') throw conflict(`"${m.title}" is already ${m.status}`);
  m.status = 'ready';
  m.readyAt = nowIso();
  return getProject(u, projectId);
}

export function approveMilestone(u: User, projectId: string, milestoneId: string): ProjectDetail {
  projectFor(u, projectId);
  if (u.role !== 'client') throw forbidden('Only the client approves a milestone');
  const m = milestoneFor(projectId, milestoneId);
  if (m.status === 'approved') throw conflict(`"${m.title}" is already approved`);
  m.status = 'approved';
  m.approvedAt = nowIso();
  m.approvedBy = u.name;
  return getProject(u, projectId);
}

// ---- messages ----
export function listMessages(u: User, projectId: string): Message[] {
  projectFor(u, projectId);
  return db().messages.filter((m) => m.projectId === projectId);
}

export function sendMessage(u: User, projectId: string, b: Record<string, unknown>): Message {
  projectFor(u, projectId);
  // The contact guard hides phone numbers (also said in words), email addresses, links and handles before saving.
  const g = scrub(str(b.body, 'message', 2000));
  const m: Message = {
    id: nextId('M'), projectId, senderId: u.id, senderName: u.name, body: g.body, sentAt: nowIso(),
    ...(g.redacted ? { redacted: true, hiddenKinds: g.kinds } : {}),
    ...(g.asksOffPlatform ? { warning: 'Please keep the conversation and payments on the platform.' } : {}),
  };
  db().messages.push(m);
  return m;
}

// ---- SOW upload and comparison ----
export function uploadSow(u: User, projectId: string, b: Record<string, unknown>): UploadSowResult {
  const project = projectFor(u, projectId);
  const kind = b.kind;
  if (kind !== 'baseline' && kind !== 'amendment') throw bad('kind must be baseline or amendment');
  if (kind === 'amendment' && u.role !== 'client') throw forbidden('Only the client uploads an amendment');
  const filename = str(b.filename, 'filename', 200);
  if (!/\.(txt|md|pdf)$/i.test(filename)) throw bad('Only .txt, .md and .pdf files are accepted');
  const text = str(b.text, 'text', 500_000);
  const docs = db().sow.filter((s) => s.projectId === projectId);
  const desk = db().desks.get(projectId)!;
  const hash = (t: string) => crypto.createHash('sha256').update(t.trim()).digest('hex');
  const textHashes = db().hashes;

  const parsed = parseSow(text);
  if (!parsed.items.length) throw bad('No deliverables, included or excluded items could be read from this file. Check the headings, or add the items by hand.');

  const baseline = docs.find((d) => d.kind === 'baseline');
  if (kind === 'baseline' && baseline) throw conflict('A signed SOW is already uploaded for this project');
  if (kind === 'amendment' && !baseline) throw conflict('Upload the signed SOW first');

  // Same text uploaded again: reuse the existing document, so it cannot double-charge.
  const dupId = textHashes.get(`${projectId}:${hash(text)}`);
  const dup = dupId ? docs.find((d) => d.id === dupId) : undefined;
  const doc: SowDocument = dup ?? {
    id: nextId('S'), projectId, version: docs.length + 1, kind, filename, uploadedBy: u.id, uploadedAt: nowIso(), items: parsed.items,
  };
  if (!dup) {
    db().sow.push(doc);
    textHashes.set(`${projectId}:${hash(text)}`, doc.id);
  }

  if (kind === 'baseline') {
    desk.scope = {
      included: parsed.items.filter((i) => i.section !== 'excluded').map((i) => i.text),
      excluded: parsed.items.filter((i) => i.section === 'excluded').map((i) => i.text),
    };
    if (parsed.ratePerHour) {
      desk.ratePerHour = parsed.ratePerHour;
      project.ratePerHour = parsed.ratePerHour;
    }
    return { document: doc, compare: null, project: getProject(u, projectId) };
  }

  const items = compareSow(baseline!.items, doc.items);
  const requests = items
    .filter((i) => i.label === 'new' || i.label === 'previously_excluded' || i.label === 'changed')
    .map((i, n) => ({ id: `CR-v${doc.version}-${n + 1}`, text: i.text, hours: i.hours, classifyAs: 'change' as const, label: i.label }));
  try {
    desk.importRequests(requests.map(({ label: _l, ...r }) => r), u.id);
  } catch (e) {
    if (e instanceof ValidationError) throw bad(e.message);
    throw e;
  }
  const labels = db().labels.get(projectId)!;
  for (const r of requests) if (r.label !== 'unchanged') labels[r.id] = r.label as 'new' | 'previously_excluded' | 'changed';
  return {
    document: doc,
    compare: { fromVersion: baseline!.version, toVersion: doc.version, items, changeRequestIds: requests.map((r) => r.id) },
    project: getProject(u, projectId),
  };
}

// ---- decisions on a change request ----
function decide(u: User, projectId: string, changeId: string, who: 'client' | 'any', fn: (d: ScopeDesk) => unknown): ProjectDetail {
  projectFor(u, projectId);
  if (who === 'client' && u.role !== 'client') throw forbidden('Only the client approves or rejects a change');
  const desk = db().desks.get(projectId)!;
  if (!desk.requests().some((r) => r.id === changeId)) throw notFound('Change request not found');
  try {
    fn(desk);
  } catch (e) {
    if (e instanceof ConflictError) throw conflict(e.message);
    if (e instanceof ValidationError) throw bad(e.message);
    throw e;
  }
  return getProject(u, projectId);
}

export const approveChange = (u: User, pid: string, cid: string) => decide(u, pid, cid, 'client', (d) => d.approve(cid, u.name));
export const rejectChange = (u: User, pid: string, cid: string, reason: unknown) =>
  decide(u, pid, cid, 'client', (d) => d.reject(cid, u.name, typeof reason === 'string' ? reason : undefined));
export const reopenChange = (u: User, pid: string, cid: string, reason: unknown) =>
  decide(u, pid, cid, 'any', (d) => d.reopen(cid, u.name, typeof reason === 'string' ? reason : ''));

// ---- freelancer dashboard ----
export function freelancerDashboard(u: User): FreelancerDashboard {
  if (u.role !== 'freelancer') throw forbidden('This dashboard is for freelancers');
  const projects: DashboardProject[] = [];
  const attention: AttentionItem[] = [];
  for (const p of listProjects(u)) {
    const d = getProject(u, p.id);
    const count = (s: string) => d.changeRequests.filter((c) => c.state === s).length;
    const hasBaseline = d.sowDocuments.some((s) => s.kind === 'baseline');
    projects.push({
      project: p, clientName: d.client.name, totals: d.totals, hasBaseline,
      counts: { awaitingClient: count('quoted'), needsClarification: count('needs_clarification'), rejected: count('rejected'), approved: count('approved') },
    });
    const note = (kind: AttentionItem['kind'], text: string) => attention.push({ kind, projectId: p.id, projectTitle: p.jobTitle, text });
    if (!hasBaseline) note('upload_sow', 'Upload the signed SOW so extra requests can be compared against it.');
    for (const c of d.changeRequests) {
      if (c.state === 'needs_clarification') note('clarify_hours', `${c.text}: hours are unknown, so it cannot be priced yet.`);
      if (c.state === 'rejected') note('rejected_change', `${c.text} was rejected${c.decisionReason ? ` (${c.decisionReason})` : ''}. You can reopen it with a reason.`);
    }
    const waiting = count('quoted');
    if (waiting) note('awaiting_client', `${waiting} change ${waiting === 1 ? 'order is' : 'orders are'} waiting for the client to decide.`);
  }
  const applications = db().applications
    .filter((a) => a.freelancerId === u.id)
    .map((a) => ({ ...a, jobTitle: db().jobs.find((j) => j.id === a.jobId)?.title }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = db().jobs.filter((j) => j.status === 'open' && !hasApplied(u, j.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    stats: {
      activeProjects: projects.length,
      pendingApplications: applications.filter((a) => a.status === 'pending').length,
      openJobs: open.length,
      approvedValue: projects.reduce((sum, p) => sum + p.totals.committedValue, 0),
    },
    projects, attention, applications, openJobs: open.slice(0, 3),
  };
}

// ---- client dashboard ----
// Recent things that happened on the client's jobs and projects, newest first.
function clientActivity(u: User): ActivityItem[] {
  const items: ActivityItem[] = [];
  const myJobs = db().jobs.filter((j) => j.clientId === u.id);
  for (const a of db().applications.filter((x) => myJobs.some((j) => j.id === x.jobId))) {
    const job = myJobs.find((j) => j.id === a.jobId)!;
    items.push({ id: 'app-' + a.id, kind: 'applicant', text: a.freelancerName + ' applied', detail: job.title, at: a.createdAt, href: '/client/jobs/' + job.id });
  }
  for (const p of listProjects(u)) {
    for (const m of db().messages.filter((x) => x.projectId === p.id && x.senderId !== u.id)) {
      items.push({ id: 'msg-' + m.id, kind: 'message', text: m.senderName + ' sent a message', detail: p.jobTitle, at: m.sentAt, href: '/client/projects/' + p.id });
    }
    for (const m of db().milestones.filter((x) => x.projectId === p.id)) {
      if (m.status === 'ready' && m.readyAt) items.push({ id: 'ms-r-' + m.id, kind: 'milestone', text: m.title + ' is ready for review', detail: p.jobTitle, at: m.readyAt, href: '/client/projects/' + p.id + '/milestones' });
      if (m.status === 'approved' && m.approvedAt) items.push({ id: 'ms-a-' + m.id, kind: 'milestone', text: 'You approved ' + m.title, detail: p.jobTitle, at: m.approvedAt, href: '/client/projects/' + p.id + '/milestones' });
    }
    const desk = db().desks.get(p.id);
    for (const e of desk ? desk.audit() : []) {
      if (e.action === 'approved' || e.action === 'rejected') {
        items.push({ id: 'co-' + p.id + '-' + e.seq, kind: 'change_order', text: 'Change order ' + e.id + ' ' + e.action, detail: p.jobTitle, at: e.at, href: '/client/projects/' + p.id });
      } else if (e.action === 'imported' && e.by && e.by !== 'fixture') {
        items.push({ id: 'co-' + p.id + '-' + e.seq, kind: 'change_order', text: 'Change order ' + e.id + ' was priced', detail: p.jobTitle, at: e.at, href: '/client/projects/' + p.id });
      }
    }
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

export function clientDashboard(u: User): ClientDashboard {
  if (u.role !== 'client') throw forbidden('This dashboard is for clients');
  const projects: ClientDashboardProject[] = [];
  const attention: ClientAttentionItem[] = [];
  for (const p of listProjects(u)) {
    const d = getProject(u, p.id);
    const count = (s: string) => d.changeRequests.filter((c) => c.state === s).length;
    const hasBaseline = d.sowDocuments.some((s) => s.kind === 'baseline');
    const counts = { awaitingDecision: count('quoted'), needsClarification: count('needs_clarification'), rejected: count('rejected'), approved: count('approved') };
    projects.push({ project: p, freelancerName: d.freelancer.name, totals: d.totals, hasBaseline, counts });
    const href = `/client/projects/${p.id}`;
    if (!hasBaseline) attention.push({ kind: 'no_sow', title: p.jobTitle, text: `Waiting for ${d.freelancer.name} to upload the signed SOW.`, href });
    if (counts.awaitingDecision) {
      attention.push({ kind: 'change_orders', title: p.jobTitle, text: `${counts.awaitingDecision} change ${counts.awaitingDecision === 1 ? 'order needs' : 'orders need'} your decision.`, href });
    }
    if (counts.needsClarification) {
      attention.push({ kind: 'clarify', title: p.jobTitle, text: `${counts.needsClarification} requested ${counts.needsClarification === 1 ? 'item has' : 'items have'} no hours yet, so it cannot be priced.`, href });
    }
  }
  const jobs = db().jobs
    .filter((j) => j.clientId === u.id)
    .map((job) => {
      const apps = db().applications.filter((a) => a.jobId === job.id);
      return { job, applicantCount: apps.length, pendingCount: apps.filter((a) => a.status === 'pending').length };
    })
    .sort((a, b) => b.job.createdAt.localeCompare(a.job.createdAt));
  for (const j of jobs) {
    if (j.job.status === 'open' && j.pendingCount) {
      attention.push({ kind: 'applicants', title: j.job.title, text: `${j.pendingCount} ${j.pendingCount === 1 ? 'applicant is' : 'applicants are'} waiting for you.`, href: `/client/jobs/${j.job.id}` });
    }
  }
  return {
    stats: {
      activeProjects: projects.length,
      applicantsWaiting: jobs.filter((j) => j.job.status === 'open').reduce((n, j) => n + j.pendingCount, 0),
      awaitingDecision: projects.reduce((n, p) => n + p.counts.awaitingDecision, 0),
      approvedSpend: projects.reduce((n, p) => n + p.totals.committedValue, 0),
    },
    attention, projects, jobs, activity: clientActivity(u),
  };
}

export const demo = (): DemoResult => runDemo();

export function siteStats(): SiteStats {
  const checks = runDemo();
  return {
    jobProfiles: library().profiles.length,
    sampleFreelancers: db().users.filter(isFreelancer).length,
    checksPassed: checks.steps.filter((s) => s.pass).length,
    checksTotal: checks.steps.length,
  };
}

// ---- calls in a project: voice or video, watched live by the contact guard ----
const peerOf = (project: Project, u: User): string => (project.clientId === u.id ? project.freelancerId : project.clientId);

function pushSignal(project: Project, u: User, type: CallSignalType, payload: string): CallSignal {
  const seq = nextSeq();
  const sig: CallSignal = { id: `SIG${seq}`, seq, projectId: project.id, fromUserId: u.id, toUserId: peerOf(project, u), type, payload, at: nowIso() };
  db().signals.push(sig);
  if (db().signals.length > 2000) db().signals.splice(0, db().signals.length - 1000); // keep memory small
  return sig;
}

// Rings the other person in the project. mode is 'voice' or 'video'.
export function startCall(u: User, projectId: string, b: Record<string, unknown> = {}): CallSignal {
  const project = projectFor(u, projectId);
  const mode: CallMode = b.mode === 'video' ? 'video' : 'voice';
  return pushSignal(project, u, 'ring', JSON.stringify({ mode }));
}

// The signals addressed to this person since the given number.
export function listCallSignals(u: User, projectId: string, since: number): CallSignal[] {
  projectFor(u, projectId);
  return db().signals.filter((s) => s.projectId === projectId && s.toUserId === u.id && s.seq > since);
}

// Offer, answer, ICE candidate, hang up or reject. Only the two people in the project can send.
export function sendCallSignal(u: User, projectId: string, b: Record<string, unknown>): CallSignal {
  const project = projectFor(u, projectId);
  const type = b.type as CallSignalType;
  if (!['offer', 'answer', 'ice', 'hangup', 'reject'].includes(type)) throw bad('Unknown call signal type');
  const payload = typeof b.payload === 'string' ? b.payload : b.payload === undefined ? '' : JSON.stringify(b.payload);
  if (payload.length > 20000) throw bad('Call signal is too large');
  return pushSignal(project, u, type, payload);
}

// One line of live captions from this person's microphone. The guard checks it: a clean line goes to the
// other person as a caption; a line with a phone number, email, link or handle (also said in words) ends the call.
export function reportCaption(u: User, projectId: string, b: Record<string, unknown>): CaptionResult {
  const project = projectFor(u, projectId);
  const text = str(b.text, 'caption', 600);
  const r = inspectSpeech(text);
  if (!r.block) {
    pushSignal(project, u, 'caption', text);
    return { blocked: false, reasons: [] };
  }
  // End the call for both people, and leave a note in the project chat. The spoken details are not saved anywhere.
  pushSignal(project, u, 'hangup', JSON.stringify({ reason: 'guard', reasons: r.reasons }));
  db().messages.push({
    id: nextId('M'), projectId, senderId: 'platform', senderName: 'CraftHire guard',
    body: `The call was ended because personal contact details were said (${r.reasons.join(', ')}). They were not saved. Please keep the conversation and payments on the platform.`,
    sentAt: nowIso(),
  });
  return { blocked: true, reasons: r.reasons };
}
