// Shared types for the whole app. OWNER: Krishna. Do not edit; ask Krishna for changes.
// Money is whole rupees, always before tax. Hours that are unknown are null, never 0.

export type Role = 'client' | 'freelancer';

export interface User {
  id: string;
  name: string;
  role: Role;
  skills: string[];
  emailVerified?: boolean; // false until the verification email (Brevo, planned) is confirmed; Google accounts start verified
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
  // Client profile: company details the client entered themselves (shown instead of any sample company)
  company?: CompanyInfo;
  credits?: number; // client call credits; missing = the starting amount (see lib/engine/credits.js)
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
  // set on a real review left after a completed project on Crewmate (sample reviews have none)
  projectId?: string;
  fromId?: string;
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
  // The first SOW only (docs/SCOPE_FLOW.md step 1). Missing on older data, which counts as signed.
  status?: SowStatus;
  ratePerHour?: number | null; // a "Rate:" line read from the file, applied when signed
  review?: { by: string; at: string; rows: Array<{ hours: number | null; note: string }> }; // the freelancer's hours, same order as items
  signedAt?: string;
  history?: Array<{ at: string; by: 'client' | 'freelancer'; action: string; note: string }>;
}

// proposed: waiting for the freelancer; awaiting_client: the freelancer changed hours, the client confirms;
// signed: the scope; sent_back: the freelancer asked for a new version; replaced: a newer upload took its place
export type SowStatus = 'proposed' | 'awaiting_client' | 'signed' | 'sent_back' | 'replaced';

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
  committedHours: number; // approved change orders + agreed new tasks + own-defect fixes
  remainingHours: number;
  committedValue: number; // approved change orders + agreed new tasks
  utilization: number | null;
  beforeTax: true;
  tasks?: { agreed: number; agreedHours: number; agreedValue: number; defectHours: number }; // new tasks in plain English
}

// ---- a new task asked for in plain English (docs/SCOPE_FLOW.md step 3) ----
export type TaskLabel = 'included' | 'excluded' | 'new' | 'defect' | 'unclear';
export type TaskStatus =
  | 'waiting_freelancer' // the freelancer has to answer
  | 'needs_details' // the freelancer asked the client for details
  | 'negotiating' // a quote is being agreed (see negotiation)
  | 'agreed' // both sides agreed a price: committed work
  | 'included' // the freelancer said it is already in the SOW: no charge
  | 'defect_fix' // the freelancer's own defect: no charge, hours booked
  | 'declined'; // closed, nothing committed

export interface TaskEvent { at: string; by: 'client' | 'freelancer'; action: string; note: string }

export interface TaskRequest {
  id: string;
  projectId: string;
  text: string;
  details: string[]; // the client's answers when asked for details
  urgent: boolean;
  askedAt: string;
  suggestion: { label: TaskLabel; matched: string | null; reason: string; source: 'rules' };
  status: TaskStatus;
  negotiationId: string | null;
  bookedHours: number | null; // hours booked for an own-defect fix (no charge)
  events: TaskEvent[];
  negotiation?: import('./engine/negotiation').NegotiationView | null; // filled in when read
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
  taskRequests: TaskRequest[];
  work: WorkItem[]; // the task list: signed SOW rows and agreed requests
  progress: import('./engine/progress').Progress;
  checkins: CheckIn[]; // newest first
  checkinStatus: import('./engine/progress').CheckinStatus;
  // Feedback after the job: open once the client has approved every milestone; one review per side
  feedback: { complete: boolean; mine: ReviewItem | null; theirs: ReviewItem | null };
  // Calls cost the client 1 credit when answered; freelancers never pay. The balance is shown only to the client.
  callCredits: { payer: 'you' | 'client'; canCall: boolean; balance: number | null; cost: number };
}

// One change to a client's call credits
export interface CreditEntry {
  id: string;
  userId: string;
  delta: number; // -1 for a call, +credits for a purchase
  balanceAfter: number;
  reason: 'call' | 'purchase';
  projectId?: string;
  projectTitle?: string;
  packId?: string;
  price?: number; // rupees, before GST (no payment is taken in the demo)
  at: string;
}
export interface CreditsInfo {
  balance: number;
  callCost: number;
  startCredits: number;
  packs: Array<{ id: string; credits: number; price: number; label: string; popular?: boolean }>;
  history: CreditEntry[]; // newest first
}

// ---- the task list, progress and daily check-ins (docs/SCOPE_FLOW.md section 2) ----
export type WorkStatus = 'todo' | 'in_progress' | 'done' | 'approved';
export interface WorkItem {
  key: string; // stable id: sow:<doc id>:<row>, or task:<request id>
  title: string;
  hours: number | null; // agreed hours; null = unknown (listed, not counted in progress)
  source: 'sow' | 'request' | 'defect' | 'included'; // a signed SOW row, an agreed request, an own-defect fix, already included
  price: number | null; // for an agreed request (before tax); null otherwise
  milestoneId: string | null;
  status: WorkStatus;
  events: Array<{ at: string; by: 'client' | 'freelancer'; action: string; note: string }>;
}
// What is stored for a task (the rest comes from the SOW or the request)
export interface WorkState {
  key: string;
  projectId: string;
  status: WorkStatus;
  milestoneId: string | null;
  events: WorkItem['events'];
}
export interface CheckIn {
  id: string;
  projectId: string;
  day: string; // YYYY-MM-DD, India time
  at: string;
  did: string;
  hours: number;
  blockers: string;
  moved: Array<{ key: string; title: string; to: WorkStatus }>;
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
  projectId?: string; // the project made when someone was hired, for the two people in it
}

export interface DashboardProject {
  project: Project;
  clientName: string;
  totals: Totals;
  hasBaseline: boolean;
  counts: { awaitingClient: number; needsClarification: number; rejected: number; approved: number };
}

export interface AttentionItem {
  kind: 'upload_sow' | 'review_sow' | 'checkin' | 'clarify_hours' | 'rejected_change' | 'awaiting_client';
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
  kind: 'applicants' | 'change_orders' | 'no_sow' | 'confirm_sow' | 'approve_work' | 'no_checkin' | 'clarify';
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
  fields?: Record<string, string>; // for forms: the message for each field
  type: 'validation' | 'conflict' | 'forbidden' | 'not_found' | 'server';
}
