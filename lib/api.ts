// The ONLY way pages talk to the server. OWNER: Krishna. Do not call fetch in pages.
// Every function throws an Error whose message is safe to show to the user.
import type {
  Application, CallMode, CallSignal, CaptionResult, ClientDashboard, ClientProfile, DemoResult, Freelancer, FreelancerDashboard, FreelancerProfile, FreelancerSearch, Job, JobDetail, SiteStats, LibraryResponse, Message, Project, ProjectDetail, SowKind, TaskRequest, UploadSowResult, User, WorkStatus,
} from './types';
import type { OfferInput } from './engine/negotiation';
import { getRole, getUserId } from './session';

// An error from the server. `fields` holds the message for each form field when the problem is in the form.
export class ApiError extends Error {
  fields: Record<string, string>;
  status: number;
  constructor(message: string, fields: Record<string, string> = {}, status = 0) {
    super(message);
    this.fields = fields;
    this.status = status;
  }
}

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', 'x-demo-user': getUserId() ?? '', 'x-demo-role': getRole() ?? '' },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(`The server sent an unreadable reply (HTTP ${res.status}).`);
  }
  if (!res.ok) {
    const body = data as { error?: string; fields?: Record<string, string> };
    throw new ApiError(body.error || `Request failed (HTTP ${res.status}).`, body.fields ?? {}, res.status);
  }
  return data as T;
}

const post = <T>(path: string, body?: unknown) => call<T>(path, { method: 'POST', body: body ?? {} });

// users and profile
export const listDemoUsers = () => call<User[]>('/api/users');
export const getMe = () => call<User>('/api/me');
export const register = (b: { name: string; email: string; password: string; confirmPassword: string; accountType: 'client' | 'freelancer' | 'both'; acceptedTerms: boolean }) => post<User>('/api/auth/register', b);
export const addRole = (role: 'client' | 'freelancer') => post<User>('/api/auth/add-role', { role });
export const logout = () => post<{ ok: true }>('/api/auth/logout');
export const getAuthConfig = () => call<{ google: boolean }>('/api/auth/config');
export const login = (b: { email: string; password: string; role: 'client' | 'freelancer' }) => post<User>('/api/login', b);
export const updateMe = (b: { name?: string; skills?: string[]; headline?: string; overview?: string; location?: string; ratePerHour?: number; company?: Partial<Omit<import('./types').CompanyInfo, 'memberSince'>> }) =>
  call<User>('/api/me', { method: 'PUT', body: b });

// browsing freelancers (client side)
export const searchFreelancers = (o: { q?: string; category?: string; skill?: string; maxRate?: number; available?: boolean } = {}) => {
  const p = new URLSearchParams();
  if (o.q) p.set('q', o.q);
  if (o.category) p.set('category', o.category);
  if (o.skill) p.set('skill', o.skill);
  if (o.maxRate) p.set('maxRate', String(o.maxRate));
  if (o.available) p.set('available', '1');
  return call<FreelancerSearch>(`/api/freelancers?${p.toString()}`);
};
export const getFreelancer = (id: string) => call<FreelancerProfile>(`/api/freelancers/${id}`);
export const getClient = (id: string) => call<ClientProfile>(`/api/clients/${id}`);
export const listSaved = () => call<Freelancer[]>('/api/saved');
export const setSaved = (id: string, saved: boolean) => call<{ saved: boolean }>(`/api/saved/${id}`, { method: 'PUT', body: { saved } });

// jobs
export const listJobs = (o: { mine?: boolean; status?: string } = {}) =>
  call<Job[]>(`/api/jobs?${o.mine ? 'mine=1&' : ''}${o.status ? `status=${encodeURIComponent(o.status)}` : ''}`);
export const createJob = (b: { title: string; description: string; budget: number; deadline: string; profileId?: string }) => post<Job>('/api/jobs', b);
export const getLibrary = () => call<LibraryResponse>('/api/library');
export const getJob = (id: string) => call<JobDetail>(`/api/jobs/${id}`);
export const applyToJob = (jobId: string, b: { pitch: string; proposedPrice: number }) => post<Application>(`/api/jobs/${jobId}/applications`, b);
export const acceptApplication = (applicationId: string, milestones?: Array<{ title: string; amount: number }>) =>
  post<{ projectId: string }>(`/api/applications/${applicationId}/accept`, milestones ? { milestones } : {});
export const rejectApplication = (applicationId: string) =>
  post<{ id: string; status: 'rejected' }>(`/api/applications/${applicationId}/reject`, {});

// projects and workspace
export const listProjects = () => call<Project[]>('/api/projects');
export const getProject = (id: string) => call<ProjectDetail>(`/api/projects/${id}`);
export const listMessages = (projectId: string) => call<Message[]>(`/api/projects/${projectId}/messages`);
export const sendMessage = (projectId: string, body: string) => post<Message>(`/api/projects/${projectId}/messages`, { body });

// milestones (record only, no money moves)
export const markMilestoneReady = (projectId: string, milestoneId: string) => post<ProjectDetail>(`/api/projects/${projectId}/milestones/${milestoneId}/ready`);
export const approveMilestone = (projectId: string, milestoneId: string) => post<ProjectDetail>(`/api/projects/${projectId}/milestones/${milestoneId}/approve`);

// SOW upload (txt or md text for now) and change orders
export const uploadSow = (projectId: string, b: { kind: SowKind; filename: string; text: string }) =>
  post<UploadSowResult>(`/api/projects/${projectId}/sow`, b);
// The task list and daily check-ins
export const moveWork = (projectId: string, key: string, to: WorkStatus, note?: string) =>
  post<ProjectDetail>(`/api/projects/${projectId}/work/${encodeURIComponent(key)}`, { action: 'move', to, note });
export const setWorkMilestone = (projectId: string, key: string, milestoneId: string | null) =>
  post<ProjectDetail>(`/api/projects/${projectId}/work/${encodeURIComponent(key)}`, { action: 'milestone', milestoneId });
export const addCheckin = (projectId: string, b: { did: string; hours: number; blockers?: string; moved?: Array<{ key: string; to: WorkStatus }> }) =>
  post<ProjectDetail>(`/api/projects/${projectId}/checkins`, b);
// Sign-off of the first SOW (rows: the freelancer's hours per item, in order; null = unknown)
export type SowReview =
  | { action: 'approve'; rows?: Array<{ hours: number | null; note?: string }>; note?: string }
  | { action: 'send_back'; note: string }
  | { action: 'confirm'; note?: string };
export const reviewSow = (projectId: string, docId: string, b: SowReview) => post<ProjectDetail>(`/api/projects/${projectId}/sow/${docId}`, b);
export const approveChange = (projectId: string, changeId: string) => post<ProjectDetail>(`/api/projects/${projectId}/changes/${changeId}/approve`);
export const rejectChange = (projectId: string, changeId: string, reason: string) =>
  post<ProjectDetail>(`/api/projects/${projectId}/changes/${changeId}/reject`, { reason });
export const reopenChange = (projectId: string, changeId: string, reason: string) =>
  post<ProjectDetail>(`/api/projects/${projectId}/changes/${changeId}/reopen`, { reason });

// ---- new tasks in plain English, and the negotiation on their price ----
export type TaskAction =
  | { action: 'included'; note?: string }
  | { action: 'defect'; hours: number; note?: string }
  | { action: 'quote'; offer: OfferInput }
  | { action: 'ask'; note: string }
  | { action: 'details'; text: string }
  | { action: 'decline'; note: string }
  | { action: 'counter'; offer: OfferInput }
  | { action: 'accept' };
export const listTasks = (projectId: string) => call<TaskRequest[]>(`/api/projects/${projectId}/tasks`);
export const askForTask = (projectId: string, b: { text: string; urgent?: boolean }) =>
  post<{ task: TaskRequest; created: boolean; project: ProjectDetail }>(`/api/projects/${projectId}/tasks`, b);
export const actOnTask = (projectId: string, taskId: string, b: TaskAction) => post<ProjectDetail>(`/api/projects/${projectId}/tasks/${taskId}`, b);

// freelancer dashboard (one call for everything on the page)
export const getFreelancerDashboard = () => call<FreelancerDashboard>('/api/dashboard');

// client dashboard (one call for everything on the page)
export const getClientDashboard = () => call<ClientDashboard>('/api/client-dashboard');

// public numbers for the landing page
export const getSiteStats = () => call<SiteStats>('/api/stats');

// calls inside a project (voice or video), watched live by the contact guard
export const startCall = (projectId: string, mode: CallMode) => post<CallSignal>(`/api/projects/${projectId}/call`, { mode });
export const pollCallSignals = (projectId: string, since: number) => call<CallSignal[]>(`/api/projects/${projectId}/call/signals?since=${since}`);
export const sendCallSignal = (projectId: string, body: { type: string; payload?: string }) => post<CallSignal>(`/api/projects/${projectId}/call/signal`, body);
export const sendCaption = (projectId: string, text: string) => post<CaptionResult>(`/api/projects/${projectId}/call/caption`, { text });

// the Help assistant: source is 'ai' when a model wrote the reply from the site guide, 'rules' for the keyword answer
export const askHelp = (question: string, role?: 'client' | 'freelancer') =>
  post<{ text: string; links: Array<{ label: string; href: string }>; topics: Array<{ id: string; title: string }>; source: 'ai' | 'rules' }>('/api/help', { question, role });

// whether the AI second check on chat and calls is switched on
export const getAiStatus = () => call<{ enabled: boolean; provider: string | null }>('/api/ai-status');

// demo and reset
export const runCaseChecks = () => call<DemoResult>('/api/demo');
export const resetData = () => post<{ ok: true }>('/api/reset');
