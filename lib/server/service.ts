// Business operations with role checks. OWNER: Krishna.
// Money rules live in lib/engine (plain JS, tested). This file wires people, jobs and projects to it.
import crypto from 'node:crypto';
import { ConflictError, ScopeDesk, ValidationError } from '@/lib/engine/scopeDesk';
import { Negotiations, type OfferInput, type Party } from '@/lib/engine/negotiation';
import { suggestTask } from '@/lib/engine/taskrules';
import { checkMove, checkinStatus as checkinClock, computeProgress, istDay, MoveError } from '@/lib/engine/progress';
import { CALL_COST, CreditError, PACKS, START_CREDITS, balanceOf, buyPack, canCall, chargeCall } from '@/lib/engine/credits';
import type { EngineView } from '@/lib/engine/scopeDesk';
import type {
  ActivityItem, Application, AttentionItem, CallMode, CallSignal, CallSignalType, CaptionResult, Freelancer, FreelancerProfile, FreelancerSearch, ChangeRequest, ClientAttentionItem, ClientDashboard, ClientProfile, ClientDashboardProject, DashboardProject, DemoResult, Flag, FreelancerDashboard, Job, JobDetail,
  JobStatus, Message, Role, MilestoneSummary, SiteStats, Project, ProjectDetail, SowDocument, SowKind, TaskRequest, UploadSowResult, User, WorkItem, WorkStatus, CheckIn, CreditEntry, CreditsInfo,
} from '@/lib/types';
import { runDemo } from '@/lib/engine/demo';
import { bad, conflict, forbidden, notFound } from './errors';
import { matchesAllWords } from '@/lib/search';
import { COMPANIES, PORTFOLIO, REVIEWS } from '@/lib/data/sampleProfiles';
import { requestRole } from './context';
import { inspectSpeech, scrub, numberFragment, splitNumber, HIDDEN } from '@/lib/engine/guard';
import { review as aiReview } from '@/lib/engine/aiguard';
import { parseSow, compareSow } from '@/lib/engine/sow';
import { checkSplit, defaultSplit } from '@/lib/milestones';
import type { MilestoneDraft } from '@/lib/milestones';
import { findProfile, library } from './library';
import { db, nextId, nextSeq } from './store';
import { insertSignal, persistent, signalsSince } from './persist';

const nowIso = () => new Date().toISOString();
// An optional text field: missing or blank becomes '', otherwise trimmed and length-checked.
const optText = (v: unknown, name: string, max: number): string => {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') throw bad(`${name} must be text`);
  if (v.trim().length > max) throw bad(`${name} is too long (maximum ${max} characters)`);
  return v.trim();
};
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
  const id = userId || requestRole.getStore()?.sessionUserId || null; // a signed-in real account needs only its cookie
  const u = db().users.find((x) => x.id === id);
  if (!u) throw forbidden('Choose a role first (Continue as Client or Freelancer)');
  // Demo accounts (synthetic) are used with the x-demo-user header. A real account must have its signed session cookie.
  if (!u.demo && requestRole.getStore()?.sessionUserId !== u.id) throw forbidden('Please log in again');
  // One account with both roles acts as the side named in the request (x-demo-role).
  const want = requestRole.getStore()?.role;
  if (want && want !== u.role && u.roles?.includes(want as Role)) return { ...u, role: want as Role };
  return u;
}

const isFreelancer = (x: User) => x.role === 'freelancer' || Boolean(x.roles?.includes('freelancer'));
const isClient = (x: User) => x.role === 'client' || Boolean(x.roles?.includes('client'));

// The start page offers only the demo users; the other freelancers exist to be browsed.
export const listUsers = (): User[] => db().users.filter((u) => u.demo);

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
    // optional text: an empty field clears it (it used to fail the whole save with "is required")
    if (body.headline !== undefined) u.headline = optText(body.headline, 'headline', 120);
    if (body.overview !== undefined) u.overview = optText(body.overview, 'overview', 1000);
    if (body.location !== undefined) u.location = optText(body.location, 'location', 60);
    if (body.ratePerHour !== undefined && body.ratePerHour !== null && body.ratePerHour !== '') u.ratePerHour = wholeRupees(body.ratePerHour, 'ratePerHour');
  }
  if (side === 'client' && body.company !== undefined) {
    const c = body.company;
    if (!c || typeof c !== 'object' || Array.isArray(c)) throw bad('company must be an object');
    const g = c as Record<string, unknown>;
    const website = optText(g.website, 'website', 120);
    if (website && !/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(website)) throw bad('Website must look like example.com');
    u.company = {
      name: optText(g.name, 'company name', 80),
      industry: optText(g.industry, 'industry', 60),
      size: optText(g.size, 'company size', 40),
      location: optText(g.location, 'location', 60),
      website,
      about: optText(g.about, 'about the company', 1000),
      memberSince: u.company?.memberSince ?? String(new Date().getFullYear()),
    };
  }
  return { ...u, role: side };
}

// ---- browsing freelancers (client side) ----
// Ratings come from the (sample) reviews when there are any.
// Real reviews (left after a completed project) and the sample ones, newest first.
const reviewsFor = (id: string, from: Role) => [...db().reviews, ...REVIEWS].filter((r) => r.toId === id && r.fromRole === from).sort((a, b) => b.date.localeCompare(a.date));
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
    id: c.id, name: c.name, email: u.id === c.id ? c.email : undefined,
    // what the client entered (if they filled in a company name), otherwise the sample company, if any
    company: c.company?.name ? c.company : (COMPANIES[id] ?? null),
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
  // Once someone is hired, the project for this job, if this person is one of its two sides
  const project = db().projects.find((p) => p.jobId === id && (p.clientId === u.id || p.freelancerId === u.id));
  return { job, client, typicalTotal, applications: withSkills, ...(project ? { projectId: project.id } : {}) };
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
    totals: (() => {
      // change orders (the scope desk) plus new tasks agreed in plain English and own-defect fixes
      const t = taskTotals(id);
      const committedHours = desk.committedHours() + t.agreedHours + t.defectHours;
      return {
        committedHours, remainingHours: desk.availableHours - committedHours, committedValue: desk.committedValue() + t.agreedValue,
        utilization: desk.availableHours === 0 ? null : committedHours / desk.availableHours,
        beforeTax: true as const, tasks: t,
      };
    })(),
    audit: desk.audit(),
    taskRequests: listTaskViews(id),
    ...workParts(id),
    feedback: feedbackFor(u, project),
    callCredits: callCreditsFor(u, project),
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

const SPLIT_KIND = 'phone number (sent in pieces)';
const SPLIT_WINDOW_MS = 15 * 60_000;

// This person's latest messages in the project that are only part of a number, newest last. Messages from the
// other person in between do not break the run; any other message from this person does, and so does a gap of
// more than 15 minutes. `continues` is true when the run already ended in pieces that were hidden.
function splitPieces(u: User, projectId: string) {
  const pieces: { msg: Message; piece: { digits: number; spoken: boolean } }[] = [];
  const mine = db().messages.filter((m) => m.projectId === projectId && m.senderId === u.id);
  let continues = false;
  let after = Date.now();
  for (let i = mine.length - 1; i >= 0; i -= 1) {
    const m = mine[i];
    const at = Date.parse(m.sentAt);
    if (after - at > SPLIT_WINDOW_MS) break;
    if (m.hiddenKinds?.includes(SPLIT_KIND)) { continues = true; break; }
    const piece = numberFragment(m.body);
    if (!piece) break;
    pieces.unshift({ msg: m, piece });
    after = at;
  }
  return { pieces, continues };
}

export async function sendMessage(u: User, projectId: string, b: Record<string, unknown>): Promise<Message> {
  projectFor(u, projectId);
  const text = str(b.body, 'message', 2000);
  // The contact guard hides phone numbers (also said in words), email addresses, links and handles before saving.
  const g = scrub(text);
  let body = g.body;
  let redacted = g.redacted;
  let kinds = g.kinds;
  // If the rules found nothing, an AI model (when a key is set) gets a second look. If it flags the message, the
  // whole message is hidden. With no key, or if the model is slow or down, only the rules decide.
  // A number sent one piece per message ("eight", "one", "zero", ...): read this person's recent number-only
  // messages together. If they add up to a phone number, hide this one and the earlier pieces.
  const piece = !redacted ? numberFragment(text) : null;
  if (piece) {
    const split = splitPieces(u, projectId);
    if (split.continues || splitNumber([...split.pieces.map((p) => p.piece), piece])) {
      split.pieces.forEach(({ msg }) => { msg.body = HIDDEN; msg.redacted = true; msg.hiddenKinds = [SPLIT_KIND]; });
      body = HIDDEN; redacted = true; kinds = [SPLIT_KIND];
    }
  }
  if (!redacted) {
    const ai = await aiReview(text, { env: process.env });
    if (ai?.flag) { body = `${HIDDEN} (hidden by the AI check)`; redacted = true; kinds = [`AI check: ${ai.reasons.join('; ')}`]; }
  }
  const m: Message = {
    id: nextId('M'), projectId, senderId: u.id, senderName: u.name, body, sentAt: nowIso(),
    ...(redacted ? { redacted: true, hiddenKinds: kinds } : {}),
    ...(g.asksOffPlatform ? { warning: 'Please keep the conversation and payments on the platform.' } : {}),
  };
  db().messages.push(m);
  return m;
}

// ---- SOW upload and comparison ----
// The first SOW (the baseline) goes through a sign-off (docs/SCOPE_FLOW.md step 1): the client uploads it, the freelancer
// approves it (filling in or changing the hours per row) or sends it back, and if hours changed the client confirms them.
// Only a signed baseline is the scope that requests are checked against. Older baselines without a status are signed.
export const sowStatus = (d: SowDocument) => d.status ?? 'signed';
const signedBaseline = (projectId: string) => db().sow.find((d) => d.projectId === projectId && d.kind === 'baseline' && sowStatus(d) === 'signed');

function signBaseline(projectId: string, doc: SowDocument, by: User) {
  const project = db().projects.find((p) => p.id === projectId)!;
  const desk = db().desks.get(projectId)!;
  doc.status = 'signed';
  doc.signedAt = nowIso();
  doc.history = [...(doc.history ?? []), { at: doc.signedAt, by: party(by), action: 'signed', note: 'Signed by both sides' }];
  desk.scope = {
    included: doc.items.filter((i) => i.section !== 'excluded').map((i) => i.text),
    excluded: doc.items.filter((i) => i.section === 'excluded').map((i) => i.text),
  };
  if (doc.ratePerHour) {
    desk.ratePerHour = doc.ratePerHour;
    project.ratePerHour = doc.ratePerHour;
  }
}

export function uploadSow(u: User, projectId: string, b: Record<string, unknown>): UploadSowResult {
  projectFor(u, projectId);
  const kind = b.kind;
  if (kind !== 'baseline' && kind !== 'amendment') throw bad('kind must be baseline or amendment');
  if (u.role !== 'client') throw forbidden(kind === 'baseline' ? 'The client uploads the first SOW; the freelancer then reviews and signs it' : 'Only the client uploads an amendment');
  const filename = str(b.filename, 'filename', 200);
  if (!/\.(txt|md|pdf)$/i.test(filename)) throw bad('Only .txt, .md and .pdf files are accepted');
  const text = str(b.text, 'text', 500_000);
  const docs = db().sow.filter((s) => s.projectId === projectId);
  const desk = db().desks.get(projectId)!;
  const hash = (t: string) => crypto.createHash('sha256').update(t.trim()).digest('hex');
  const textHashes = db().hashes;

  const parsed = parseSow(text);
  if (!parsed.items.length) throw bad('No deliverables, included or excluded items could be read from this file. Check the headings, or add the items by hand.');

  const baseline = signedBaseline(projectId);
  if (kind === 'baseline' && baseline) throw conflict('The SOW is already signed. Ask for changes with an amendment or a new task');
  if (kind === 'amendment' && !baseline) throw conflict('The first SOW has to be signed by both sides before an amendment');

  // Same text uploaded again: reuse the existing document, so it cannot double-charge. (A first SOW that was sent back
  // or replaced can be uploaded again as a new version, for a fresh review.)
  const dupId = textHashes.get(`${projectId}:${hash(text)}`);
  const found = dupId ? docs.find((d) => d.id === dupId) : undefined;
  const dup = found && !(found.kind === 'baseline' && ['sent_back', 'replaced'].includes(sowStatus(found))) ? found : undefined;
  if (dup) return { document: dup, compare: null, project: getProject(u, projectId) };

  const doc: SowDocument = {
    id: nextId('S'), projectId, version: docs.length + 1, kind, filename, uploadedBy: u.id, uploadedAt: nowIso(), items: parsed.items,
  };
  if (kind === 'baseline') {
    // an earlier draft that was not signed yet is replaced by this one
    for (const d of docs.filter((x) => x.kind === 'baseline' && sowStatus(x) !== 'signed' && sowStatus(x) !== 'replaced')) d.status = 'replaced';
    doc.status = 'proposed';
    doc.ratePerHour = parsed.ratePerHour ?? null;
    doc.history = [{ at: doc.uploadedAt, by: 'client', action: 'uploaded', note: filename }];
  }
  db().sow.push(doc);
  textHashes.set(`${projectId}:${hash(text)}`, doc.id);
  if (kind === 'baseline') return { document: doc, compare: null, project: getProject(u, projectId) };

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

// The sign-off of the first SOW. Freelancer: approve {rows?: [{hours, note}] in the same order as the items} or
// send_back {note}. Client: confirm (the freelancer's hours) or send_back {note} (the hours go back to the freelancer).
export function reviewSow(u: User, projectId: string, docId: string, b: Record<string, unknown>): ProjectDetail {
  projectFor(u, projectId);
  const doc = db().sow.find((d) => d.id === docId && d.projectId === projectId);
  if (!doc) throw notFound('SOW not found');
  if (doc.kind !== 'baseline') throw bad('Only the first SOW is signed off; amendments become change orders');
  const status = sowStatus(doc);
  const note = typeof b.note === 'string' ? b.note.trim().slice(0, 1000) : '';
  const log = (action: string, text: string) => { doc.history = [...(doc.history ?? []), { at: nowIso(), by: party(u), action, note: text }]; };
  const action = b.action;

  if (u.role === 'freelancer') {
    if (status !== 'proposed') throw conflict(status === 'signed' ? 'This SOW is already signed' : `This SOW is ${status.replace('_', ' ')}, not waiting for your review`);
    if (action === 'send_back') {
      if (!note) throw bad('Say what needs to change');
      doc.status = 'sent_back';
      log('sent_back', note);
    } else if (action === 'approve') {
      const rows = b.rows === undefined ? doc.items.map((i) => ({ hours: i.hours, note: '' })) : b.rows;
      if (!Array.isArray(rows) || rows.length !== doc.items.length) throw bad(`rows must list all ${doc.items.length} items, in order`);
      const clean = rows.map((r: { hours?: unknown; note?: unknown }, n: number) => {
        const h = r?.hours === undefined ? doc.items[n].hours : r.hours;
        if (h !== null && (typeof h !== 'number' || !Number.isFinite(h) || h < 0 || h > 1000)) throw bad(`Row ${n + 1}: hours must be a number from 0 to 1000, or empty when unknown`);
        return { hours: h as number | null, note: typeof r?.note === 'string' ? r.note.trim().slice(0, 300) : '' };
      });
      const changed = clean.some((r, n) => r.hours !== doc.items[n].hours);
      doc.review = { by: u.name, at: nowIso(), rows: clean };
      if (changed) {
        doc.status = 'awaiting_client';
        log('approved_with_hours', note || 'Approved, with hours filled in or changed: the client confirms them');
      } else {
        log('approved', note || 'Approved as uploaded');
        signBaseline(projectId, doc, u);
      }
    } else throw bad('action must be approve or send_back');
  } else {
    if (status !== 'awaiting_client') throw conflict(status === 'signed' ? 'This SOW is already signed' : 'Nothing is waiting for your confirmation');
    if (action === 'confirm') {
      doc.items = doc.items.map((i, n) => ({ ...i, hours: doc.review!.rows[n].hours }));
      log('confirmed_hours', note || "Confirmed the freelancer's hours");
      signBaseline(projectId, doc, u);
    } else if (action === 'send_back') {
      if (!note) throw bad('Say what is wrong with the hours');
      doc.status = 'proposed';
      log('hours_sent_back', note);
    } else throw bad('action must be confirm or send_back');
  }
  return getProject(u, projectId);
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

export const approveChange = (u: User, pid: string, cid: string) => decide(u, pid, cid, 'client', (d) => {
  // the desk checks its own hours; agreed new tasks and defect fixes use hours too
  const r = d.requests().find((x) => x.id === cid);
  const t = taskTotals(pid);
  if (r?.hours != null && t.agreedHours + t.defectHours > 0) checkCapacity(pid, r.hours);
  return d.approve(cid, u.name);
});
export const rejectChange = (u: User, pid: string, cid: string, reason: unknown) =>
  decide(u, pid, cid, 'client', (d) => d.reject(cid, u.name, typeof reason === 'string' ? reason : undefined));
export const reopenChange = (u: User, pid: string, cid: string, reason: unknown) =>
  decide(u, pid, cid, 'any', (d) => d.reopen(cid, u.name, typeof reason === 'string' ? reason : ''));

// ---- feedback after the job ----
// A project is complete when it has milestones and the client has approved every one. Then each side can leave
// one review (1 to 5 stars and a comment) for the other; it shows on the other person's profile and rating.
function projectComplete(projectId: string): boolean {
  const ms = db().milestones.filter((m) => m.projectId === projectId);
  return ms.length > 0 && ms.every((m) => m.status === 'approved');
}

function feedbackFor(u: User, project: Project) {
  const here = db().reviews.filter((r) => r.projectId === project.id);
  return {
    complete: projectComplete(project.id),
    mine: here.find((r) => r.fromId === u.id) ?? null,
    theirs: here.find((r) => r.toId === u.id) ?? null,
  };
}

export function leaveReview(u: User, projectId: string, b: Record<string, unknown>): ProjectDetail {
  const project = projectFor(u, projectId);
  if (!projectComplete(projectId)) throw conflict('Feedback opens when the client has approved every milestone of this project');
  if (db().reviews.some((r) => r.projectId === projectId && r.fromId === u.id)) throw conflict('You already left feedback for this project');
  const rating = b.rating;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) throw bad('Choose a rating from 1 to 5 stars');
  const text = str(b.text, 'feedback', 1000);
  if (text.length < 10) throw bad('Write at least a sentence (10 characters)');
  const isClient = u.id === project.clientId;
  const toId = isClient ? project.freelancerId : project.clientId;
  const me = db().users.find((x) => x.id === u.id);
  db().reviews.push({
    id: nextId('RV'), projectId, fromId: u.id, toId,
    fromName: u.name, fromRole: isClient ? 'client' : 'freelancer',
    ...(isClient && (me?.company?.name || COMPANIES[u.id]?.name) ? { fromCompany: me?.company?.name || COMPANIES[u.id]!.name } : {}),
    rating,
    text: scrub(text).body, // contact details are hidden here too, like in chat
    date: nowIso().slice(0, 10),
    projectTitle: project.jobTitle,
  });
  return getProject(u, projectId);
}

// ---- the task list, progress and daily check-ins (docs/SCOPE_FLOW.md section 2) ----
// A task comes from a row of the signed first SOW (included rows only) or from a request both sides agreed on (or the
// freelancer fixes as their own defect, or says is already included). Only its status and milestone are stored.

function workItems(projectId: string): WorkItem[] {
  const items: Array<Omit<WorkItem, 'status' | 'milestoneId' | 'events'>> = [];
  const base = signedBaseline(projectId);
  if (base) {
    base.items.forEach((it, n) => {
      if (it.section !== 'excluded') items.push({ key: `sow:${base.id}:${n}`, title: it.text, hours: it.hours, source: 'sow', price: null });
    });
  }
  const book = db().deals.get(projectId);
  for (const t of db().tasks.filter((x) => x.projectId === projectId)) {
    if (t.status === 'agreed' && t.negotiationId && book) {
      const a = book.view(t.negotiationId).agreed!;
      items.push({ key: `task:${t.id}`, title: t.text, hours: a.hours, source: 'request', price: a.price });
    } else if (t.status === 'defect_fix') {
      items.push({ key: `task:${t.id}`, title: `Fix: ${t.text}`, hours: t.bookedHours, source: 'defect', price: 0 });
    } else if (t.status === 'included') {
      items.push({ key: `task:${t.id}`, title: t.text, hours: null, source: 'included', price: 0 });
    }
  }
  return items.map((it) => {
    const st = db().work.find((w) => w.projectId === projectId && w.key === it.key);
    return { ...it, status: st?.status ?? 'todo', milestoneId: st?.milestoneId ?? null, events: st?.events ?? [] };
  });
}

function workParts(projectId: string) {
  const project = db().projects.find((p) => p.id === projectId)!;
  const work = workItems(projectId);
  const checkins = db().checkins.filter((c) => c.projectId === projectId).sort((a, b) => b.at.localeCompare(a.at));
  // the clock starts when the SOW was signed (or the project began, for older data)
  const since = signedBaseline(projectId)?.signedAt ?? project.createdAt;
  const active = work.some((w) => w.status !== 'approved');
  return { work, progress: computeProgress(work), checkins, checkinStatus: checkinClock(checkins.map((c) => c.day), since, new Date(), active) };
}

function workState(projectId: string, key: string) {
  let st = db().work.find((w) => w.projectId === projectId && w.key === key);
  if (!st) {
    st = { key, projectId, status: 'todo', milestoneId: null, events: [] };
    db().work.push(st);
  }
  return st;
}

// Moves one task (and, when the last task of a milestone is approved, marks that milestone ready for the client).
function moveWork(u: User, projectId: string, key: string, to: unknown, note: string) {
  const item = workItems(projectId).find((w) => w.key === key);
  if (!item) throw notFound('Task not found');
  let action: string;
  try {
    action = checkMove(item.status, String(to), party(u), note);
  } catch (e) {
    if (e instanceof MoveError) throw e.message.startsWith('Only') ? forbidden(e.message) : e.message.startsWith('Say') || e.message.startsWith('Unknown') ? bad(e.message) : conflict(e.message);
    throw e;
  }
  const st = workState(projectId, key);
  st.status = to as WorkStatus;
  st.events.push({ at: nowIso(), by: party(u), action, note });
  if (st.status === 'approved' && st.milestoneId) {
    const ms = db().milestones.find((m) => m.id === st.milestoneId);
    const all = workItems(projectId).filter((w) => w.milestoneId === st.milestoneId);
    if (ms && ms.status === 'pending' && all.every((w) => w.status === 'approved')) {
      ms.status = 'ready';
      ms.readyAt = nowIso();
    }
  }
  return item;
}

// { action: 'move', to, note? } or { action: 'milestone', milestoneId } (the freelancer puts a task in a milestone)
export function actOnWork(u: User, projectId: string, key: string, b: Record<string, unknown>): ProjectDetail {
  projectFor(u, projectId);
  const note = typeof b.note === 'string' ? b.note.trim().slice(0, 500) : '';
  if (b.action === 'move') {
    moveWork(u, projectId, key, b.to, note);
  } else if (b.action === 'milestone') {
    if (u.role !== 'freelancer') throw forbidden('The freelancer arranges tasks into milestones');
    const item = workItems(projectId).find((w) => w.key === key);
    if (!item) throw notFound('Task not found');
    const mid = b.milestoneId === null || b.milestoneId === '' ? null : String(b.milestoneId);
    if (mid !== null && !db().milestones.some((m) => m.id === mid && m.projectId === projectId)) throw bad('Unknown milestone');
    const st = workState(projectId, key);
    st.milestoneId = mid;
    st.events.push({ at: nowIso(), by: 'freelancer', action: 'milestone', note: mid ? db().milestones.find((m) => m.id === mid)!.title : 'No milestone' });
  } else {
    throw bad('action must be move or milestone');
  }
  return getProject(u, projectId);
}

// The freelancer's daily check-in: what was done, hours spent, blockers, and tasks moved (started or done) in one go.
export function addCheckin(u: User, projectId: string, b: Record<string, unknown>): ProjectDetail {
  projectFor(u, projectId);
  if (u.role !== 'freelancer') throw forbidden('The freelancer posts the daily check-in');
  const did = str(b.did, 'what you did', 2000);
  if (did.length < 3) throw bad('Say what you did today');
  const hours = b.hours;
  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours < 0 || hours > 24) throw bad('Hours spent today must be from 0 to 24');
  const blockers = typeof b.blockers === 'string' ? b.blockers.trim().slice(0, 1000) : '';
  const day = istDay(new Date());
  if (db().checkins.some((c) => c.projectId === projectId && c.day === day)) throw conflict("You already checked in today. Tomorrow's check-in opens at midnight (India time)");
  const moves = Array.isArray(b.moved) ? (b.moved as Array<{ key?: unknown; to?: unknown }>) : [];
  if (moves.length > 50) throw bad('Too many tasks in one check-in');
  // check every move first, so a bad one changes nothing
  const items = workItems(projectId);
  for (const m of moves) {
    const it = items.find((w) => w.key === m.key);
    if (!it) throw bad('A task in the check-in was not found');
    try { checkMove(it.status, String(m.to), 'freelancer'); } catch (e) { if (e instanceof MoveError) throw bad(`${it.title}: ${e.message}`); throw e; }
  }
  const moved = moves.map((m) => {
    const it = moveWork(u, projectId, String(m.key), m.to, 'In the daily check-in');
    return { key: it.key, title: it.title, to: m.to as WorkStatus };
  });
  const c: CheckIn = { id: nextId('C'), projectId, day, at: nowIso(), did, hours, blockers, moved };
  db().checkins.push(c);
  return getProject(u, projectId);
}

// ---- new tasks asked for in plain English (docs/SCOPE_FLOW.md step 3) ----
// The client writes what they want; the rules suggest a label against the signed scope; the freelancer answers
// (already included, own defect, quote, ask for details, decline); a quote is negotiated until one side accepts the
// other's latest offer. Only then is it committed work. Nothing here moves money.

const party = (u: User): Party => (u.role === 'client' ? 'client' : 'freelancer');
const normText = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function dealsFor(projectId: string): Negotiations {
  let book = db().deals.get(projectId);
  if (!book) {
    book = new Negotiations({ now: nowIso });
    db().deals.set(projectId, book);
  }
  return book;
}

function taskFor(projectId: string, taskId: string): TaskRequest {
  const t = db().tasks.find((x) => x.id === taskId && x.projectId === projectId);
  if (!t) throw notFound('Task request not found');
  return t;
}

function taskTotals(projectId: string) {
  const book = db().deals.get(projectId);
  let agreed = 0; let agreedHours = 0; let agreedValue = 0; let defectHours = 0;
  for (const t of db().tasks.filter((x) => x.projectId === projectId)) {
    if (t.status === 'agreed' && t.negotiationId && book) {
      const a = book.view(t.negotiationId).agreed!;
      agreed += 1; agreedHours += a.hours ?? 0; agreedValue += a.price ?? 0;
    }
    if (t.status === 'defect_fix') defectHours += t.bookedHours ?? 0;
  }
  return { agreed, agreedHours, agreedValue, defectHours };
}

// Hours still free in the project: the scope desk's remaining hours (after approved change orders), minus agreed
// tasks and defect fixes.
function hoursLeft(projectId: string): number {
  const t = taskTotals(projectId);
  return db().desks.get(projectId)!.remainingHours() - t.agreedHours - t.defectHours;
}

function checkCapacity(projectId: string, hours: number | null) {
  if (hours === null) return;
  const left = hoursLeft(projectId);
  if (hours > left) throw conflict(`This needs ${hours}h but only ${left}h are left in this project. Counter with fewer hours, or agree more capacity first.`);
}

function taskView(t: TaskRequest): TaskRequest {
  const book = db().deals.get(t.projectId);
  return { ...t, negotiation: t.negotiationId && book ? book.view(t.negotiationId) : null };
}

const listTaskViews = (projectId: string) => db().tasks.filter((t) => t.projectId === projectId).map(taskView);

function logTask(t: TaskRequest, u: User, action: string, note = '') {
  t.events.push({ at: nowIso(), by: party(u), action, note });
}

export function listTasks(u: User, projectId: string): TaskRequest[] {
  projectFor(u, projectId);
  return listTaskViews(projectId);
}

// The client asks for something new. The same text again (while the first is not declined) returns the first one,
// so a repeat cannot double-book or double-charge.
export function createTask(u: User, projectId: string, b: Record<string, unknown>): { task: TaskRequest; created: boolean; project: ProjectDetail } {
  projectFor(u, projectId);
  if (u.role !== 'client') throw forbidden('Only the client asks for new work');
  const text = str(b.text, 'request', 1000);
  if (text.length < 5) throw bad('Describe the request in a few words');
  if (b.urgent !== undefined && typeof b.urgent !== 'boolean') throw bad('urgent must be true or false');
  const key = normText(text);
  const same = db().tasks.find((t) => t.projectId === projectId && t.status !== 'declined' && normText(t.text) === key);
  if (same) {
    logTask(same, u, 'repeat_ignored', 'The same request was sent again and ignored');
    return { task: taskView(same), created: false, project: getProject(u, projectId) };
  }
  const t: TaskRequest = {
    id: nextId('T'), projectId, text, details: [], urgent: b.urgent === true, askedAt: nowIso(),
    suggestion: suggestTask(text, db().desks.get(projectId)!.scope),
    status: 'waiting_freelancer', negotiationId: null, bookedHours: null, events: [],
  };
  logTask(t, u, 'asked', text);
  db().tasks.push(t);
  return { task: taskView(t), created: true, project: getProject(u, projectId) };
}

// What the browser sent as an offer. The negotiation engine checks every field, so it is passed on as it is, with the
// project rate filled in when neither a rate nor a fixed price was given.
function offerFrom(o: unknown, rate: number, rushDefault = false): OfferInput {
  const raw = (o && typeof o === 'object' && !Array.isArray(o) ? o : {}) as OfferInput;
  const fixed = raw.price !== undefined && raw.price !== null;
  return { ...raw, ratePerHour: fixed ? raw.ratePerHour : (raw.ratePerHour ?? rate), rush: raw.rush ?? (rushDefault && !fixed) };
}

// Everything that can happen to a task request after it is asked, one action at a time.
export function actOnTask(u: User, projectId: string, taskId: string, b: Record<string, unknown>): ProjectDetail {
  const project = projectFor(u, projectId);
  const t = taskFor(projectId, taskId);
  const action = b.action;
  const note = typeof b.note === 'string' ? b.note.trim().slice(0, 1000) : '';
  const isFreelancer = u.role === 'freelancer';
  const answerable = t.status === 'waiting_freelancer' || t.status === 'needs_details';
  const book = dealsFor(projectId);
  const wrap = <T,>(fn: () => T): T => {
    try { return fn(); } catch (e) {
      if (e instanceof ConflictError) throw conflict(e.message);
      if (e instanceof ValidationError) throw bad(e.message);
      throw e;
    }
  };

  switch (action) {
    // ---- the freelancer's first answer ----
    case 'included': {
      if (!isFreelancer) throw forbidden('Only the freelancer answers a request');
      if (!answerable) throw conflict(`This request is already ${t.status.replace('_', ' ')}`);
      t.status = 'included';
      logTask(t, u, 'accepted_as_included', note || 'Already part of the signed SOW: no extra charge');
      break;
    }
    case 'defect': {
      if (!isFreelancer) throw forbidden('Only the freelancer answers a request');
      if (!answerable) throw conflict(`This request is already ${t.status.replace('_', ' ')}`);
      const hours = b.hours;
      if (typeof hours !== 'number' || !Number.isFinite(hours) || hours < 0 || hours > 1000) throw bad('Give the hours the fix will take (0 to 1000). They are booked, but not charged');
      checkCapacity(projectId, hours);
      t.status = 'defect_fix';
      t.bookedHours = hours;
      logTask(t, u, 'fix_own_defect', note || `Our own defect: fixed at no charge, ${hours}h booked`);
      break;
    }
    case 'quote': {
      if (!isFreelancer) throw forbidden('Only the freelancer quotes');
      if (!answerable) throw conflict(`This request is already ${t.status.replace('_', ' ')}`);
      // default: the project rate, and the rush fee when the client marked it urgent
      const offer = offerFrom(b.offer, project.ratePerHour, t.urgent);
      const { negotiation } = wrap(() => book.open({ kind: 'task', ref: `${projectId}:${t.id}` }, 'freelancer', offer));
      t.negotiationId = negotiation.id;
      t.status = 'negotiating';
      logTask(t, u, 'quoted', negotiation.latest.price === null ? 'Quote without a price yet' : `Quoted ${negotiation.latest.price} before tax`);
      break;
    }
    case 'ask': {
      if (!isFreelancer) throw forbidden('Only the freelancer asks for details');
      if (!answerable) throw conflict(`This request is already ${t.status.replace('_', ' ')}`);
      if (!note) throw bad('Write the question for the client');
      t.status = 'needs_details';
      logTask(t, u, 'asked_for_details', note);
      break;
    }
    case 'details': {
      if (isFreelancer) throw forbidden('Only the client adds details');
      if (t.status !== 'needs_details') throw conflict('The freelancer has not asked for details');
      const more = str(b.text, 'details', 1000);
      t.details.push(more);
      t.status = 'waiting_freelancer';
      logTask(t, u, 'added_details', more);
      break;
    }
    case 'decline': {
      // before a quote: the freelancer turns it down, or the client withdraws it; during a quote: either side
      if (!note) throw bad('Say why');
      if (t.status === 'negotiating') {
        wrap(() => book.decline(t.negotiationId!, party(u), note));
      } else if (!answerable) {
        throw conflict(`This request is already ${t.status.replace('_', ' ')}`);
      }
      t.status = 'declined';
      logTask(t, u, isFreelancer ? 'declined' : 'withdrawn', note);
      break;
    }
    // ---- the negotiation on a quote ----
    case 'counter': {
      if (t.status !== 'negotiating') throw conflict('There is no quote to answer');
      const offer = offerFrom(b.offer, project.ratePerHour);
      const v = wrap(() => book.counter(t.negotiationId!, party(u), offer));
      logTask(t, u, 'countered', v.latest.price === null ? 'Counter without a price' : `Countered with ${v.latest.price} before tax`);
      break;
    }
    case 'accept': {
      if (t.status !== 'negotiating') throw conflict(t.status === 'agreed' ? 'Already agreed' : 'There is no quote to accept');
      const latest = book.view(t.negotiationId!).latest;
      if (latest.by !== party(u)) checkCapacity(projectId, latest.hours); // own-offer accept is refused by the engine below
      const v = wrap(() => book.accept(t.negotiationId!, party(u)));
      t.status = 'agreed';
      logTask(t, u, 'agreed', `Agreed ${v.agreed!.price} before tax${v.agreed!.hours !== null ? ` for ${v.agreed!.hours}h` : ''}`);
      break;
    }
    default:
      throw bad('action must be one of: included, defect, quote, ask, details, decline, counter, accept');
  }
  return getProject(u, projectId);
}

// ---- freelancer dashboard ----
export function freelancerDashboard(u: User): FreelancerDashboard {
  if (u.role !== 'freelancer') throw forbidden('This dashboard is for freelancers');
  const projects: DashboardProject[] = [];
  const attention: AttentionItem[] = [];
  for (const p of listProjects(u)) {
    const d = getProject(u, p.id);
    const count = (s: string) => d.changeRequests.filter((c) => c.state === s).length;
    const hasBaseline = d.sowDocuments.some((s) => s.kind === 'baseline' && sowStatus(s) === 'signed');
    const toReview = d.sowDocuments.some((s) => s.kind === 'baseline' && sowStatus(s) === 'proposed');
    projects.push({
      project: p, clientName: d.client.name, totals: d.totals, hasBaseline,
      counts: { awaitingClient: count('quoted'), needsClarification: count('needs_clarification'), rejected: count('rejected'), approved: count('approved') },
    });
    const note = (kind: AttentionItem['kind'], text: string) => attention.push({ kind, projectId: p.id, projectTitle: p.jobTitle, text });
    if (toReview) note('review_sow', 'The client uploaded the SOW. Review it, fill in the hours and approve it, or send it back.');
    else if (!hasBaseline) note('upload_sow', 'Waiting for the client to upload the SOW, or to confirm your hours.');
    if (d.work.length && !d.checkinStatus.checkedInToday && d.work.some((w) => w.status !== 'approved')) note('checkin', d.checkinStatus.warn ? `No check-in for ${d.checkinStatus.daysSince} days: the client can see this. Post today's check-in.` : "Post today's check-in.");
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
    const hasBaseline = d.sowDocuments.some((s) => s.kind === 'baseline' && sowStatus(s) === 'signed');
    const sowState = d.sowDocuments.filter((s) => s.kind === 'baseline').map(sowStatus);
    const counts = { awaitingDecision: count('quoted'), needsClarification: count('needs_clarification'), rejected: count('rejected'), approved: count('approved') };
    projects.push({ project: p, freelancerName: d.freelancer.name, totals: d.totals, hasBaseline, counts });
    const href = `/client/projects/${p.id}`;
    if (sowState.includes('awaiting_client')) attention.push({ kind: 'confirm_sow', title: p.jobTitle, text: `${d.freelancer.name} approved the SOW with hours filled in. Confirm them to sign it.`, href });
    else if (!hasBaseline && sowState.includes('proposed')) attention.push({ kind: 'no_sow', title: p.jobTitle, text: `Waiting for ${d.freelancer.name} to review your SOW.`, href });
    else if (!hasBaseline) attention.push({ kind: 'no_sow', title: p.jobTitle, text: sowState.includes('sent_back') ? `${d.freelancer.name} sent the SOW back. Read why and upload a new version.` : 'Upload the SOW so the freelancer can review and sign it.', href });
    if (counts.awaitingDecision) {
      attention.push({ kind: 'change_orders', title: p.jobTitle, text: `${counts.awaitingDecision} change ${counts.awaitingDecision === 1 ? 'order needs' : 'orders need'} your decision.`, href });
    }
    const toApprove = d.work.filter((w) => w.status === 'done').length;
    if (toApprove) attention.push({ kind: 'approve_work', title: p.jobTitle, text: `${toApprove} ${toApprove === 1 ? 'task is' : 'tasks are'} done and waiting for your approval.`, href });
    if (d.checkinStatus.warn) attention.push({ kind: 'no_checkin', title: p.jobTitle, text: `No check-in from ${d.freelancer.name} for ${d.checkinStatus.daysSince} days.`, href });
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

async function pushSignal(project: Project, u: User, type: CallSignalType, payload: string): Promise<CallSignal> {
  if (persistent()) return insertSignal({ project_id: project.id, from_user: u.id, to_user: peerOf(project, u), type, payload });
  const seq = nextSeq();
  const sig: CallSignal = { id: `SIG${seq}`, seq, projectId: project.id, fromUserId: u.id, toUserId: peerOf(project, u), type, payload, at: nowIso() };
  db().signals.push(sig);
  if (db().signals.length > 2000) db().signals.splice(0, db().signals.length - 1000); // keep memory small
  return sig;
}

// Rings the other person in the project. mode is 'voice' or 'video'.
export async function startCall(u: User, projectId: string, b: Record<string, unknown> = {}): Promise<CallSignal> {
  const project = projectFor(u, projectId);
  const mode: CallMode = b.mode === 'video' ? 'video' : 'voice';
  // the client pays for calls in their project (freelancers never pay); no credits, no call
  const payer = clientOf(project);
  if (!canCall(payer.credits)) {
    throw conflict(u.id === payer.id ? 'No call credits left. Buy credits to call.' : `${payer.name} has no call credits left, so calls are paused until they buy more.`);
  }
  const sig = await pushSignal(project, u, 'ring', JSON.stringify({ mode }));
  const prev = db().calls.findIndex((c) => c.projectId === projectId);
  const entry = { projectId, startedAt: nowIso(), charged: false };
  if (prev >= 0) db().calls[prev] = entry; else db().calls.push(entry);
  return sig;
}

// ---- call credits (clients only; freelancers never pay) ----
function clientOf(project: Project): User {
  return db().users.find((x) => x.id === project.clientId)!;
}

function logCredit(e: Omit<CreditEntry, 'id' | 'at'>) {
  db().creditLog.push({ id: nextId('CR'), at: nowIso(), ...e });
}

// The call was answered (the person called accepted, which sends the offer): charge the client once for it.
function chargeAnsweredCall(project: Project) {
  const entry = db().calls.find((c) => c.projectId === project.id);
  if (!entry || entry.charged) return;
  const payer = clientOf(project);
  payer.credits = canCall(payer.credits) ? chargeCall(payer.credits) : 0;
  entry.charged = true;
  logCredit({ userId: payer.id, delta: -CALL_COST, balanceAfter: payer.credits, reason: 'call', projectId: project.id, projectTitle: project.jobTitle });
}

function callCreditsFor(u: User, project: Project) {
  const payer = clientOf(project);
  const mine = u.id === payer.id;
  return { payer: mine ? 'you' as const : 'client' as const, canCall: canCall(payer.credits), balance: mine ? balanceOf(payer.credits) : null, cost: CALL_COST };
}

export function getCredits(u: User): CreditsInfo {
  if (u.role !== 'client') throw forbidden('Credits are for clients; calls are free for freelancers');
  const me = db().users.find((x) => x.id === u.id) ?? u;
  return {
    balance: balanceOf(me.credits), callCost: CALL_COST, startCredits: START_CREDITS, packs: [...PACKS],
    history: db().creditLog.filter((e) => e.userId === u.id).sort((a, b) => b.at.localeCompare(a.at)),
  };
}

// Buying a pack. Demo: no payment is taken; the credits are added straight away.
export function buyCredits(u: User, b: Record<string, unknown>): CreditsInfo {
  if (u.role !== 'client') throw forbidden('Credits are for clients; calls are free for freelancers');
  const me = db().users.find((x) => x.id === u.id);
  if (!me) throw notFound('Account not found');
  try {
    const { balance, pack } = buyPack(me.credits, String(b.pack ?? ''));
    me.credits = balance;
    logCredit({ userId: me.id, delta: pack.credits, balanceAfter: balance, reason: 'purchase', packId: pack.id, price: pack.price });
  } catch (e) {
    if (e instanceof CreditError) throw bad(e.message);
    throw e;
  }
  return getCredits(u);
}

// The signals addressed to this person since the given number.
export async function listCallSignals(u: User, projectId: string, since: number): Promise<CallSignal[]> {
  projectFor(u, projectId);
  if (persistent()) return signalsSince(projectId, u.id, since);
  return db().signals.filter((s) => s.projectId === projectId && s.toUserId === u.id && s.seq > since);
}

// Offer, answer, ICE candidate, hang up or reject. Only the two people in the project can send.
export async function sendCallSignal(u: User, projectId: string, b: Record<string, unknown>): Promise<CallSignal> {
  const project = projectFor(u, projectId);
  const type = b.type as CallSignalType;
  if (!['offer', 'answer', 'ice', 'hangup', 'reject'].includes(type)) throw bad('Unknown call signal type');
  const payload = typeof b.payload === 'string' ? b.payload : b.payload === undefined ? '' : JSON.stringify(b.payload);
  if (payload.length > 20000) throw bad('Call signal is too large');
  if (type === 'offer') chargeAnsweredCall(project); // the call was answered: 1 credit from the client, once per call
  return pushSignal(project, u, type, payload);
}

// One line of live captions from this person's microphone. The guard checks it: a clean line goes to the
// other person as a caption; a line with a phone number, email, link or handle (also said in words) ends the call.
export async function reportCaption(u: User, projectId: string, b: Record<string, unknown>): Promise<CaptionResult> {
  const project = projectFor(u, projectId);
  const text = str(b.text, 'caption', 600);
  const r = inspectSpeech(text);
  if (!r.block) {
    // The rules found nothing: the AI model (when a key is set) gets a second look before the line is shown.
    const ai = await aiReview(text, { env: process.env });
    if (ai?.flag) { r.block = true; r.reasons = [`AI check: ${ai.reasons.join('; ')}`]; }
  }
  if (!r.block) {
    await pushSignal(project, u, 'caption', text);
    return { blocked: false, reasons: [] };
  }
  // End the call for both people, and leave a note in the project chat. The spoken details are not saved anywhere.
  await pushSignal(project, u, 'hangup', JSON.stringify({ reason: 'guard', reasons: r.reasons }));
  db().messages.push({
    id: nextId('M'), projectId, senderId: 'platform', senderName: 'Crewmate guard',
    body: `The call was ended because personal contact details were said (${r.reasons.join(', ')}). They were not saved. Please keep the conversation and payments on the platform.`,
    sentAt: nowIso(),
  });
  return { blocked: true, reasons: r.reasons };
}
