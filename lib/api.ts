// The ONLY way pages talk to the server. OWNER: Krishna. Do not call fetch in pages.
// Every function throws an Error whose message is safe to show to the user.
import type {
  Application, DemoResult, FreelancerDashboard, Job, JobDetail, Message, Project, ProjectDetail, SowKind, UploadSowResult, User,
} from './types';
import { getUserId } from './session';

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', 'x-demo-user': getUserId() ?? '' },
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
    const msg = (data as { error?: string }).error;
    throw new Error(msg || `Request failed (HTTP ${res.status}).`);
  }
  return data as T;
}

const post = <T>(path: string, body?: unknown) => call<T>(path, { method: 'POST', body: body ?? {} });

// users and profile
export const listDemoUsers = () => call<User[]>('/api/users');
export const getMe = () => call<User>('/api/me');
export const updateMe = (b: { name?: string; skills?: string[] }) => call<User>('/api/me', { method: 'PUT', body: b });

// jobs
export const listJobs = (o: { mine?: boolean; status?: string } = {}) =>
  call<Job[]>(`/api/jobs?${o.mine ? 'mine=1&' : ''}${o.status ? `status=${encodeURIComponent(o.status)}` : ''}`);
export const createJob = (b: { title: string; description: string; budget: number; deadline: string }) => post<Job>('/api/jobs', b);
export const getJob = (id: string) => call<JobDetail>(`/api/jobs/${id}`);
export const applyToJob = (jobId: string, b: { pitch: string; proposedPrice: number }) => post<Application>(`/api/jobs/${jobId}/applications`, b);
export const acceptApplication = (applicationId: string) => post<{ projectId: string }>(`/api/applications/${applicationId}/accept`);

// projects and workspace
export const listProjects = () => call<Project[]>('/api/projects');
export const getProject = (id: string) => call<ProjectDetail>(`/api/projects/${id}`);
export const listMessages = (projectId: string) => call<Message[]>(`/api/projects/${projectId}/messages`);
export const sendMessage = (projectId: string, body: string) => post<Message>(`/api/projects/${projectId}/messages`, { body });

// SOW upload (txt or md text for now) and change orders
export const uploadSow = (projectId: string, b: { kind: SowKind; filename: string; text: string }) =>
  post<UploadSowResult>(`/api/projects/${projectId}/sow`, b);
export const approveChange = (projectId: string, changeId: string) => post<ProjectDetail>(`/api/projects/${projectId}/changes/${changeId}/approve`);
export const rejectChange = (projectId: string, changeId: string, reason: string) =>
  post<ProjectDetail>(`/api/projects/${projectId}/changes/${changeId}/reject`, { reason });
export const reopenChange = (projectId: string, changeId: string, reason: string) =>
  post<ProjectDetail>(`/api/projects/${projectId}/changes/${changeId}/reopen`, { reason });

// freelancer dashboard (one call for everything on the page)
export const getFreelancerDashboard = () => call<FreelancerDashboard>('/api/dashboard');

// demo and reset
export const runCaseChecks = () => call<DemoResult>('/api/demo');
export const resetData = () => post<{ ok: true }>('/api/reset');
