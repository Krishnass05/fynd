// Shared types for the whole app. OWNER: Krishna. Do not edit; ask Krishna for changes.
// Money is whole rupees, always before tax. Hours that are unknown are null, never 0.

export type Role = 'client' | 'freelancer';

export interface User {
  id: string;
  name: string;
  role: Role;
  skills: string[];
  email?: string; // what the person entered when they registered (demo accounts only for now)
  roles?: Role[]; // an account that can use both sides lists both; `role` is the side it is acting as right now
  demo?: boolean; // shown on the start page as a one-click demo login
  // Freelancer profile fields. Seed values are sample data, not real people or real ratings.
  headline?: string;
  overview?: string;
  location?: string;
  ratePerHour?: number;
  category?: string; // matches a library category
  availability?: 'available' | 'busy';
  rating?: number; // 0 to 5, sample data
  jobsDone?: number; // sample data
}

// What a client sees when browsing freelancers.
export interface Freelancer {
  id: string;
  name: string;
  headline: string;
  location: string;
  ratePerHour: number | null;
  category: string;
  availability: 'available' | 'busy';
  rating: number | null;
  jobsDone: number;
  reviewCount?: number;
  skills: string[];
  saved?: boolean; // whether the viewing client has saved this freelancer
}

export interface FreelancerProfile extends Freelancer {
  overview: string;
  projects: Array<{ title: string; status: JobStatus }>; // real projects on this site
  portfolio: PortfolioItem[]; // previous work (sample)
  workedWith: string[]; // companies this freelancer has worked for (sample, from the previous work and reviews)
  reviews: ReviewItem[]; // reviews from clients (sample)
  reviewCount: number;
}

// Previous work shown on a freelancer's profile. Sample content for the demo.
export interface PortfolioItem { id: string; title: string; description: string; clientName: string; year: number; tags: string[] }

// A review of a freelancer (written by a client) or of a client (written by a freelancer). Sample content.
export interface ReviewItem {
  id: string;
  toId: string;
  fromName: string;
  fromRole: Role;
  fromCompany?: string;
  rating: number; // 1 to 5
  text: string;
  date: string; // ISO date
  projectTitle: string;
}

// What a client entered about their company when registering. Sample content for the demo accounts.
export interface CompanyInfo { name: string; industry: string; size: string; location: string; website: string; about: string; memberSince: string }

// A client's profile, as the client sees it and as a freelancer sees it from a job page.
export interface ClientProfile {
  id: string;
  name: string;
  email?: string; // only the client sees their own email
  company: CompanyInfo | null;
  rating: number | null; // average of the reviews
  reviewCount: number;
  reviews: ReviewItem[];
  stats: { jobsPosted: number; hires: number; openJobs: number }; // counted from real data on this site
  openJobs: Array<{ id: string; title: string }>;
}

export interface FreelancerSearch {
  freelancers: Freelancer[];
  categories: string[];
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
  profileId?: string; // library profile the job started from (sets the project rate and hours when accepted)
  category?: string;
  status: JobStatus;
  createdAt: string;
}

// One job profile from the team SOW library: typical rate and hours, what is usually included and excluded.
export interface LibraryProfile {
  id: string;
  name: string;
  category: string;
  ratePerHour: number | null;
  typicalHours: number | null;
  deliverables: string[];
  excluded: string[];
  source: 'harini' | 'sanjana';
}

export interface LibraryResponse {
  note: string;
  profiles: LibraryProfile[];
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  jobId: string;
  jobTitle?: string; // filled in by the dashboard endpoint
  freelancerSkills?: string[]; // filled in by the job endpoint, for comparing proposals
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

// Milestones split the agreed price. Record only: approving one marks it approved, no money moves.
export type MilestoneStatus = 'pending' | 'ready' | 'approved';

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  amount: number; // whole rupees, before tax
  status: MilestoneStatus;
  readyAt: string | null; // freelancer marked it ready for review
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface MilestoneSummary {
  total: number;
  approved: number;
  remaining: number;
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
  milestones: Milestone[];
  milestoneSummary: MilestoneSummary;
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
  redacted?: boolean; // true when the server hid contact details in the body
  hiddenKinds?: string[]; // what was hidden, for example 'phone number (said in words)'
  warning?: string; // set when the text asks to move off the platform (the text is kept)
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
  client: { id: string; name: string; company: string | null; rating: number | null; reviewCount: number }; // who posted it
  typicalTotal: number | null; // typical price for the job's library profile, if it started from one (illustrative)
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

export interface ClientDashboardProject {
  project: Project;
  freelancerName: string;
  totals: Totals;
  hasBaseline: boolean;
  counts: { awaitingDecision: number; needsClarification: number; rejected: number; approved: number };
}

export interface ClientDashboardJob {
  job: Job;
  applicantCount: number;
  pendingCount: number; // applicants the client has not decided on yet
}

export interface ClientAttentionItem {
  kind: 'applicants' | 'change_orders' | 'no_sow' | 'clarify';
  title: string;
  text: string;
  href: string;
}

// One line of the recent activity feed on the client dashboard.
export interface ActivityItem {
  id: string;
  kind: 'applicant' | 'message' | 'milestone' | 'change_order';
  text: string;
  detail: string;
  at: string; // ISO time
  href: string;
}

// Everything the client dashboard shows, in one call.
export interface ClientDashboard {
  stats: { activeProjects: number; applicantsWaiting: number; awaitingDecision: number; approvedSpend: number };
  attention: ClientAttentionItem[];
  projects: ClientDashboardProject[];
  jobs: ClientDashboardJob[];
  activity: ActivityItem[]; // newest first
}

// Real counts from our own data, for the landing page.
export interface SiteStats {
  jobProfiles: number;
  sampleFreelancers: number;
  checksPassed: number;
  checksTotal: number;
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

// ---- calls inside a project (voice or video). The signalling is in-app and the room is the project. ----
// A call is watched live: each person's browser turns their speech into text, the server checks every line
// with the contact guard, and the call is ended if a phone number, email address, link or handle is said.
export type CallMode = 'voice' | 'video';
export type CallSignalType = 'ring' | 'offer' | 'answer' | 'ice' | 'hangup' | 'reject' | 'caption';

export interface CallSignal {
  id: string;
  seq: number; // grows with every signal; the poller asks for signals newer than the last one it saw
  projectId: string;
  fromUserId: string;
  toUserId: string; // only the other project member receives this signal
  type: CallSignalType;
  payload: string; // JSON for ring (mode), offer/answer (SDP), ice (candidate), hangup (reason); text for caption
  at: string;
}

export interface CaptionResult { blocked: boolean; reasons: string[] }

export interface ApiErrorBody {
  error: string;
  type: 'validation' | 'conflict' | 'forbidden' | 'not_found' | 'server';
}
