// The app's data and its demo seed. OWNER: Krishna.
// db() is the ONLY way the rest of the code reaches data. In development it is one in-memory object. When Supabase is
// configured (see persist.ts) each request gets its own copy, loaded from the database and saved back after a change.
import { ScopeDesk } from '@/lib/engine/scopeDesk';
import { Negotiations } from '@/lib/engine/negotiation';
import fixture from '../../fixture.json';
import { createLimiter, type Limiter } from '@/lib/engine/authcore';
import { requestRole } from './context';
import type { Application, CallSignal, CheckIn, CompareLabel, Job, Message, Milestone, Project, ReviewItem, SowDocument, TaskRequest, User, WorkState } from '@/lib/types';

export interface Db {
  users: User[];
  jobs: Job[];
  applications: Application[];
  projects: Project[];
  sow: SowDocument[];
  messages: Message[];
  signals: CallSignal[]; // call signalling, in memory
  credentials: Map<string, string>; // user id -> salted password hash (never sent to the browser)
  googleIds: Map<string, string>; // Google account id -> user id
  limiter: Limiter; // log-in attempt limiter
  milestones: Milestone[];
  saved: Map<string, Set<string>>; // client id -> saved freelancer ids
  desks: Map<string, ScopeDesk>;
  labels: Map<string, Record<string, CompareLabel>>;
  hashes: Map<string, string>; // projectId:sha256(text) -> sow document id, to ignore repeat uploads
  tasks: TaskRequest[]; // new tasks asked for in plain English
  deals: Map<string, Negotiations>; // project id -> its negotiations (quotes on new tasks)
  work: WorkState[]; // status and milestone of each task (the task itself comes from the SOW or a request)
  checkins: CheckIn[]; // daily check-ins
  reviews: ReviewItem[]; // real reviews left after completed projects (sample reviews live in lib/data)
  seq: number;
}

const NOW = '2026-10-17T10:00:00.000Z';

export function seedDb(): Db {
  const users: User[] = [
    { id: 'u_client1', name: 'Demo Client', email: 'client@demo.test', role: 'client', skills: [], demo: true },
    { id: 'u_freelancer1', name: 'Demo Freelancer', email: 'freelancer@demo.test', role: 'freelancer', skills: ['Web design', 'WordPress', 'HTML'], demo: true, headline: 'Web designer who ships clean landing pages', overview: 'I design and build small business websites and landing pages. Two revision rounds are included in every project, and I list what is not included up front.', location: 'Hyderabad', ratePerHour: 1200, category: 'Websites, IT and Software', availability: 'available', rating: 4.8, jobsDone: 54 },
    { id: 'u_freelancer2', name: 'Second Freelancer', email: 'freelancer2@demo.test', role: 'freelancer', skills: ['Logo design', 'Illustration', 'Photoshop'], demo: true, headline: 'Logo and brand designer for new businesses', overview: 'I make simple, usable logos with colour and black-and-white versions, and I hand over the source files.', location: 'Pune', ratePerHour: 1200, category: 'Design, Media and Architecture', availability: 'available', rating: 4.9, jobsDone: 31 },
    { id: 'u_freelancer3', name: 'Asha Rao', role: 'freelancer', skills: ['React', 'JavaScript', 'Node.js', 'PostgreSQL', 'API integration'], headline: 'Full-stack developer, React and Node', overview: 'I build dashboards, internal tools and APIs for small teams, with tests and a short handover note.', location: 'Bengaluru', ratePerHour: 1500, category: 'Websites, IT and Software', availability: 'available', rating: 4.7, jobsDone: 42 },
    { id: 'u_freelancer4', name: 'Vikram Shah', role: 'freelancer', skills: ['SEO', 'Digital Marketing', 'Content writing', 'Link building'], headline: 'SEO and content for growing shops', overview: 'Keyword research, on-page fixes and a monthly content plan for small online businesses.', location: 'Mumbai', ratePerHour: 1000, category: 'Websites, IT and Software', availability: 'available', rating: 4.6, jobsDone: 27 },
    { id: 'u_freelancer5', name: 'Meera Iyer', role: 'freelancer', skills: ['Video editing', 'After Effects', 'Animation', 'Premiere Pro'], headline: 'Video editor for social and brand films', overview: 'Short-form reels and 60-second brand films, with captions and two review rounds.', location: 'Chennai', ratePerHour: 900, category: 'Design, Media and Architecture', availability: 'busy', rating: 4.8, jobsDone: 63 },
    { id: 'u_freelancer6', name: 'Rohan Das', role: 'freelancer', skills: ['Python', 'MySQL', 'Data collection'], headline: 'Python and data work', overview: 'Scripts, scrapers and reports. I write down the data source and the assumptions.', location: 'Kolkata', ratePerHour: 1400, category: 'Websites, IT and Software', availability: 'available', rating: 4.5, jobsDone: 19 },
    { id: 'u_freelancer7', name: 'Nisha Kapoor', role: 'freelancer', skills: ['3D modelling', '3D rendering', 'Blender'], headline: '3D models and renders for product and interiors', overview: 'Product models and interior visualisations, delivered as stills or short turntables.', location: 'Delhi', ratePerHour: 1300, category: 'Design, Media and Architecture', availability: 'available', rating: 4.9, jobsDone: 38 },
    { id: 'u_freelancer8', name: 'Imran Khan', role: 'freelancer', skills: ['Social media', 'Copywriting', 'Canva'], headline: 'Social media manager for local brands', overview: 'Monthly calendars, posts and reports for cafes, shops and studios.', location: 'Hyderabad', ratePerHour: 900, category: 'Websites, IT and Software', availability: 'busy', rating: 4.4, jobsDone: 22 },
    { id: 'u_both1', name: 'Demo Both', email: 'both@demo.test', role: 'client', roles: ['client', 'freelancer'], skills: ['Copywriting', 'Content writing', 'Social media'], demo: true, headline: 'Writer who also hires help for a small studio', overview: 'I write web copy and social posts for small brands, and I hire designers and developers for my own studio. This one account works on both sides.', location: 'Bengaluru', ratePerHour: 800, category: 'Websites, IT and Software', availability: 'available', rating: 4.5, jobsDone: 12 },
    { id: 'u_client2', name: 'Sample Client', email: 'sample.client@demo.test', role: 'client', skills: [] },
    { id: 'u_freelancer9', name: 'Karan Mehta', role: 'freelancer', skills: ['PHP', 'MySQL', 'HTML', 'Web Development', 'eCommerce'], headline: 'PHP developer for small business sites', overview: 'Custom PHP and MySQL websites, booking forms and admin pages, with clear handover notes.', location: 'Ahmedabad', ratePerHour: 1100, category: 'Websites, IT and Software', availability: 'available', rating: 4.6, jobsDone: 41 },
    { id: 'u_freelancer10', name: 'Sneha Reddy', role: 'freelancer', skills: ['Graphic Design', 'Photoshop', 'Illustrator', 'Visual Design'], headline: 'Graphic designer for posters, packaging and social posts', overview: 'Print and digital graphics for shops and studios. Source files included.', location: 'Hyderabad', ratePerHour: 950, category: 'Design, Media and Architecture', availability: 'available', rating: 4.7, jobsDone: 36 },
    { id: 'u_freelancer11', name: 'Farhan Ali', role: 'freelancer', skills: ['Data Entry', 'Excel', 'Data Processing', 'Customer Service'], headline: 'Accurate data entry and spreadsheet clean-up', overview: 'Typing, cleaning and checking records in Excel, with a short report of what was changed.', location: 'Lucknow', ratePerHour: 400, category: 'Data Entry and Admin', availability: 'available', rating: 4.5, jobsDone: 88 },
    { id: 'u_freelancer12', name: 'Divya Nair', role: 'freelancer', skills: ['AutoCAD', 'CAD/CAM'], headline: 'CAD drawings for small builds and fabrication', overview: 'Floor plans and part drawings from sketches, delivered as DWG and PDF.', location: 'Kochi', ratePerHour: 1000, category: 'Engineering and Science', availability: 'busy', rating: 4.4, jobsDone: 19 },
    { id: 'u_freelancer13', name: 'Arjun Pillai', role: 'freelancer', skills: ['Project Management', 'Data Analysis', 'Business Development'], headline: 'Project manager and analyst for small teams', overview: 'Plans, weekly status reports and simple dashboards for agencies and start-ups.', location: 'Chennai', ratePerHour: 1400, category: 'Business, Accounting, Human Resources and Legal', availability: 'available', rating: 4.8, jobsDone: 27 },
  ];
  const jobs: Job[] = [
    { id: 'J1', clientId: 'u_client1', title: 'Landing page for a small shop', description: 'One landing page and a contact form for a neighbourhood shop.', budget: 12000, deadline: '2026-11-10', status: 'in_progress', createdAt: NOW },
    { id: 'J2', clientId: 'u_client1', title: 'Logo for a new cafe', description: 'A simple logo with colour and black-and-white versions.', budget: 9000, deadline: '2026-11-20', status: 'open', createdAt: NOW },
    { id: 'J3', clientId: 'u_client2', title: 'Web development for a tuition centre site', description: 'A five-page site with a fee table and an enquiry form. Web development and basic SEO.', budget: 22000, deadline: '2026-12-05', category: 'Websites, IT and Software', status: 'open', createdAt: NOW },
    { id: 'J4', clientId: 'u_client2', title: 'Logo design for a juice bar', description: 'Logo design with a colour and a one-colour version, plus a short style sheet.', budget: 8000, deadline: '2026-11-25', category: 'Design, Media and Architecture', status: 'open', createdAt: NOW },
    { id: 'J5', clientId: 'u_client2', title: 'Video editing for a product launch reel', description: 'Video editing of a 60 second reel from supplied clips, with captions and music.', budget: 12000, deadline: '2026-11-30', category: 'Design, Media and Architecture', status: 'open', createdAt: NOW },
    { id: 'J6', clientId: 'u_client2', title: 'SEO clean-up for a bookshop', description: 'SEO audit and fixes for page titles, descriptions and speed on an existing shop site.', budget: 15000, deadline: '2026-12-10', category: 'Websites, IT and Software', status: 'open', createdAt: NOW },
    { id: 'J7', clientId: 'u_client2', title: 'Data entry from scanned invoices', description: 'Data entry of about 400 invoices into an Excel sheet, checked twice.', budget: 6000, deadline: '2026-11-18', category: 'Data Entry and Admin', status: 'open', createdAt: NOW },
    { id: 'J8', clientId: 'u_client2', title: 'Graphic design for a festival poster set', description: 'Graphic design of three posters and matching social posts for a local festival.', budget: 9000, deadline: '2026-11-22', category: 'Design, Media and Architecture', status: 'open', createdAt: NOW },
    { id: 'J9', clientId: 'u_client2', title: 'PHP booking form for a salon', description: 'PHP and MySQL booking form with an admin page to see and cancel appointments.', budget: 18000, deadline: '2026-12-12', category: 'Websites, IT and Software', status: 'open', createdAt: NOW },
    { id: 'J10', clientId: 'u_client2', title: 'WordPress blog setup for a trainer', description: 'WordPress install, a clean theme, three starter pages and a contact form.', budget: 10000, deadline: '2026-11-28', category: 'Websites, IT and Software', status: 'open', createdAt: NOW },
    { id: 'J11', clientId: 'u_client2', title: 'AutoCAD floor plan for a small shop', description: 'AutoCAD floor plan and one elevation from hand sketches, delivered as DWG and PDF.', budget: 7000, deadline: '2026-11-24', category: 'Engineering and Science', status: 'open', createdAt: NOW },
    { id: 'J12', clientId: 'u_client2', title: 'Project management for a website build', description: 'Project management for a six-week website build: plan, weekly status report and risk list.', budget: 20000, deadline: '2026-12-15', category: 'Business, Accounting, Human Resources and Legal', status: 'open', createdAt: NOW },
    { id: 'J13', clientId: 'u_client2', title: 'Data analysis of monthly sales', description: 'Data analysis of twelve months of sales in Excel, with a one-page summary and three charts.', budget: 9000, deadline: '2026-11-26', category: 'Business, Accounting, Human Resources and Legal', status: 'open', createdAt: NOW },
    { id: 'J14', clientId: 'u_client2', title: 'Photography of 20 handmade products', description: 'Product photography of 20 items on a plain background, edited and delivered as web-size images.', budget: 11000, deadline: '2026-12-02', category: 'Design, Media and Architecture', status: 'open', createdAt: NOW },
    { id: 'J15', clientId: 'u_client2', title: 'Animation for a 30 second explainer', description: 'Animation of a 30 second explainer from a supplied script and logo, with voice-over timing.', budget: 16000, deadline: '2026-12-08', category: 'Design, Media and Architecture', status: 'open', createdAt: NOW },
    { id: 'J16', clientId: 'u_client2', title: 'Customer service replies for a small shop', description: 'Customer service replies by email for a small shop, weekday mornings, using supplied answers.', budget: 5000, deadline: '2026-11-20', category: 'Data Entry and Admin', status: 'open', createdAt: NOW },
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
  const milestones: Milestone[] = [
    { id: 'MS1', projectId: 'P1', title: 'Kickoff and design', amount: 3600, status: 'approved', readyAt: NOW, approvedAt: NOW, approvedBy: 'Demo Client' },
    { id: 'MS2', projectId: 'P1', title: 'Build the page', amount: 4800, status: 'ready', readyAt: NOW, approvedAt: null, approvedBy: null },
    { id: 'MS3', projectId: 'P1', title: 'Final delivery', amount: 3600, status: 'pending', readyAt: null, approvedAt: null, approvedBy: null },
  ];
  // Project P1 starts with the case fixture so the three case checks are visible straight away.
  const desks = new Map<string, ScopeDesk>([['P1', ScopeDesk.fromFixture(fixture)]]);
  const labels = new Map<string, Record<string, CompareLabel>>([['P1', {}]]);
  return { users, jobs, applications, projects, sow, messages, signals: [], credentials: new Map(), googleIds: new Map(), limiter: createLimiter(), milestones, saved: new Map([['u_client1', new Set(['u_freelancer3'])]]), desks, labels, hashes: new Map(), tasks: [], deals: new Map<string, Negotiations>(), work: [], checkins: [], reviews: [], seq: 100 };
}

const g = globalThis as unknown as { __scopeDeskDb?: Db };

export function db(): Db {
  const mine = requestRole.getStore()?.db; // this request's copy, when the data lives in Supabase
  if (mine) return mine;
  if (!g.__scopeDeskDb) g.__scopeDeskDb = seedDb();
  return g.__scopeDeskDb;
}

// Back to the demo data. With Supabase the request's copy is replaced, and withState saves it.
export function resetDb(): void {
  const ctx = requestRole.getStore();
  if (ctx?.db) ctx.db = seedDb();
  else g.__scopeDeskDb = seedDb();
}

export function nextId(prefix: string): string {
  const d = db();
  d.seq += 1;
  return `${prefix}${d.seq}`;
}

// Increasing number for call signals, so a poller can ask for "everything after the last one I saw".
export function nextSeq(): number {
  const d = db();
  d.seq += 1;
  return d.seq;
}
