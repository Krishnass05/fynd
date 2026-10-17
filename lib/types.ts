// Shared types for the whole app. OWNER: Krishna. Do not edit; ask Krishna for changes.
// Money is whole rupees, always before tax. Hours that are unknown are null, never 0.

export type Role = 'client' | 'freelancer';

export interface User {
  id: string;
  name: string;
  role: Role;
  skills: string[];
}

export type JobStatus = 'open' | 'in_progress' | 'closed';

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  budget: number;
  deadline: string; // ISO date, e.g. 2026-11-10
  status: JobStatus;
  createdAt: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  jobId: string;
  jobTitle?: string; // filled in by the dashboard endpoint
  freelancerId: string;
  freelancerName: string;
  pitch: string;
  proposedPrice: number;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Project {
  id: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  freelancerId: string;
  ratePerHour: number;
  availableHours: number;
  currency: 'INR';
  createdAt: string;
}

export type SowKind = 'baseline' | 'amendment';
export type SowSection = 'deliverable' | 'included' | 'excluded';

export interface SowItem {
  section: SowSection;
  text: string;
  hours: number | null;
}

export interface SowDocument {
  id: string;
  projectId: string;
  version: number;
  kind: SowKind;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  items: SowItem[];
}

export type ChangeState =
  | 'needs_clarification'
  | 'quoted'
  | 'approved'
  | 'rejected'
  | 'defect_rework'
  | 'in_scope';

// How an item in the amended SOW relates to the signed SOW.
export type CompareLabel = 'new' | 'previously_excluded' | 'changed' | 'removed' | 'unchanged';

export interface Estimate {
  hours: number;
  ratePerHour: number;
  multiplier: number;
  amount: number;
  currency: string;
  beforeTax: true;
  assumptions: string[];
}

export interface Flag {
  code: string; // e.g. previously_excluded, hours_unknown, over_capacity
  message: string; // human reason shown next to the flag
}

export interface ChangeRequest {
  id: string;
  text: string;
  hours: number | null;
  reason: string | null;
  urgent: boolean;
  version: number;
  state: ChangeState;
  classification: 'change' | 'in_scope' | 'defect' | 'unclear';
  label: CompareLabel | null;
  estimate: Estimate | null;
  decidedBy: string | null;
  decisionReason: string | null;
  warnings: string[];
  flags: Flag[];
}

export interface Totals {
  committedHours: number;
  remainingHours: number;
  committedValue: number;
  utilization: number | null;
  beforeTax: true;
}

export interface AuditEntry {
  seq: number;
  at: string;
  action: string;
  id: string;
  by: string | null;
  version: number;
  detail: Record<string, unknown>;
}

export interface ProjectDetail {
  project: Project;
  client: User;
  freelancer: User;
  sowDocuments: SowDocument[];
  changeRequests: ChangeRequest[];
  totals: Totals;
  audit: AuditEntry[];
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  body: string;
  sentAt: string;
}

export interface CompareItem {
  label: CompareLabel;
  text: string;
  hours: number | null;
}

export interface UploadSowResult {
  document: SowDocument;
  // Present only for an amendment: what changed against the signed SOW.
  compare: { fromVersion: number; toVersion: number; items: CompareItem[]; changeRequestIds: string[] } | null;
  project: ProjectDetail;
}

export interface JobDetail {
  job: Job;
  applications: Application[]; // owner client sees all; a freelancer sees only their own
}

export interface DashboardProject {
  project: Project;
  clientName: string;
  totals: Totals;
  hasBaseline: boolean;
  counts: { awaitingClient: number; needsClarification: number; rejected: number; approved: number };
}

export interface AttentionItem {
  kind: 'upload_sow' | 'clarify_hours' | 'rejected_change' | 'awaiting_client';
  projectId: string;
  projectTitle: string;
  text: string;
}

// Everything the freelancer dashboard shows, in one call.
export interface FreelancerDashboard {
  stats: { activeProjects: number; pendingApplications: number; openJobs: number; approvedValue: number };
  projects: DashboardProject[];
  attention: AttentionItem[];
  applications: Application[];
  openJobs: Job[]; // newest open jobs the freelancer has not applied to, at most 3
}

export interface DemoStep {
  n: number;
  title: string;
  expected: string;
  actual: string;
  pass: boolean;
}

export interface DemoResult {
  allPassed: boolean;
  steps: DemoStep[];
}

export interface ApiErrorBody {
  error: string;
  type: 'validation' | 'conflict' | 'forbidden' | 'not_found' | 'server';
}
