// Business operations with role checks. OWNER: Krishna.
// Money rules live in lib/engine (plain JS, tested). This file wires people, jobs and projects to it.
import crypto from 'node:crypto';
import { ConflictError, ScopeDesk, ValidationError } from '@/lib/engine/scopeDesk';
import type { EngineView } from '@/lib/engine/scopeDesk';
import type {
  Application, AttentionItem, ChangeRequest, DashboardProject, DemoResult, Flag, FreelancerDashboard, Job, JobDetail,
  JobStatus, Message, Project, ProjectDetail, SowDocument, SowKind, UploadSowResult, User,
} from '@/lib/types';
import { runDemo } from '@/lib/engine/demo';
import { bad, conflict, forbidden, notFound } from './errors';
import { parseSow, compareSow } from '@/lib/engine/sow';
import { db, nextId } from './store';

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

export function actor(userId: string | null): User {
  const u = db().users.find((x) => x.id === userId);
  if (!u) throw forbidden('Choose a role first (Continue as Client or Freelancer)');
  return u;
}

export const listUsers = (): User[] => db().users;

export function updateMe(u: User, body: Record<string, unknown>): User {
  if (body.name !== undefined) u.name = str(body.name, 'name', 80);
  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills) || body.skills.some((s) => typeof s !== 'string' || !s.trim())) throw bad('skills must be a list of words');
    if (body.skills.length > 10) throw bad('At most 10 skills');
    u.skills = (body.skills as string[]).map((s) => s.trim());
  }
  return u;
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
  const job: Job = {
    id: nextId('J'), clientId: u.id, title: str(b.title, 'title', 120), description: str(b.description, 'description', 2000),
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
  return { job, applications };
}

export function applyToJob(u: User, jobId: string, b: Record<string, unknown>): Application {
  if (u.role !== 'freelancer') throw forbidden('Only a freelancer can apply');
  const job = db().jobs.find((j) => j.id === jobId);
  if (!job) throw notFound('Job not found');
  if (job.status !== 'open') throw conflict('This job is no longer open');
  if (hasApplied(u, jobId)) throw conflict('You already applied to this job');
  const app: Application = {
    id: nextId('A'), jobId, freelancerId: u.id, freelancerName: u.name, pitch: str(b.pitch, 'pitch', 1000),
    proposedPrice: num(b.proposedPrice, 'proposedPrice'), status: 'pending', createdAt: nowIso(),
  };
  db().applications.push(app);
  return app;
}

export function acceptApplication(u: User, applicationId: string): { projectId: string } {
  const app = db().applications.find((a) => a.id === applicationId);
  if (!app) throw notFound('Application not found');
  const job = db().jobs.find((j) => j.id === app.jobId)!;
  if (u.role !== 'client' || job.clientId !== u.id) throw forbidden('Only the client who posted the job can accept');
  if (job.status !== 'open') throw conflict('This job already has an accepted freelancer');
  if (app.status !== 'pending') throw conflict('This application was already decided');
  for (const a of db().applications.filter((x) => x.jobId === job.id)) a.status = a.id === app.id ? 'accepted' : 'rejected';
  job.status = 'in_progress';
  const project: Project = {
    id: nextId('P'), jobId: job.id, jobTitle: job.title, clientId: job.clientId, freelancerId: app.freelancerId,
    ratePerHour: 1000, availableHours: 40, currency: 'INR', createdAt: nowIso(),
  };
  db().projects.push(project);
  db().desks.set(project.id, new ScopeDesk({ scope: { included: [], excluded: [] }, ratePerHour: project.ratePerHour, availableHours: project.availableHours }));
  db().labels.set(project.id, {});
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
    totals: {
      committedHours: desk.committedHours(), remainingHours: desk.remainingHours(), committedValue: desk.committedValue(),
      utilization: desk.utilization(), beforeTax: true,
    },
    audit: desk.audit(),
  };
}

// ---- messages ----
export function listMessages(u: User, projectId: string): Message[] {
  projectFor(u, projectId);
  return db().messages.filter((m) => m.projectId === projectId);
}

export function sendMessage(u: User, projectId: string, b: Record<string, unknown>): Message {
  projectFor(u, projectId);
  const m: Message = { id: nextId('M'), projectId, senderId: u.id, senderName: u.name, body: str(b.body, 'message', 2000), sentAt: nowIso() };
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

export const demo = (): DemoResult => runDemo();
