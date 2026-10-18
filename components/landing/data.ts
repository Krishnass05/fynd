// Content for the Crewmate home page. All of it is sample content for the demo: no real customers,
// reviews or marketplace numbers. Images are local files in public/ that can be swapped for real photos.
// OWNER: Krishna.
import { SERVICES } from '@/lib/services';

export type Intent = 'hire' | 'work';

// Where a search lands. Clients search freelancers, freelancers search open jobs. Both pages read
// ?q= (words) and ?category= (one of the domains in lib/services.ts).
export interface Destination { q?: string; category?: string }

export interface Category {
  slug: string;
  name: string;
  description: string;
  image: string;
  alt: string;
  tone: string; // colour for the sweep behind the active slide
  to: Destination;
}

const W = 'Websites, IT and Software';
const D = 'Design, Media and Architecture';
const E = 'Engineering and Science';
const B = 'Business, Accounting, Human Resources and Legal';
const A = 'Data Entry and Admin';

export const CATEGORIES: Category[] = [
  { slug: 'ai-services', name: 'AI Services', description: 'AI solutions, automation, and intelligent tools.', image: '/img/categories/ai-services.png', alt: 'A robotic hand reaching toward a human hand', tone: '#eb5e28', to: { q: 'automation' } },
  { slug: 'development-it', name: 'Development & IT', description: 'Websites, applications, software, and technical expertise.', image: '/img/categories/development-it.png', alt: 'A developer at a desk looking at code on a large monitor and a laptop', tone: '#403d39', to: { category: W } },
  { slug: 'design-creative', name: 'Design & Creative', description: 'Brand identity, graphic design, UI/UX, and creative direction.', image: '/img/categories/design-creative.png', alt: 'Colour swatch books and a tablet with colour sketches on a designer desk', tone: '#eb5e28', to: { category: D } },
  { slug: 'sales-marketing', name: 'Sales & Marketing', description: 'Campaigns, growth strategy, SEO, and social media.', image: '/img/categories/sales-marketing.png', alt: 'A rail of clothes with red SALE tags on the hangers', tone: '#ccc5b9', to: { q: 'marketing' } },
  { slug: 'writing-translation', name: 'Writing & Translation', description: 'Copywriting, content creation, editing, and translation.', image: '/img/categories/writing-translation.png', alt: 'A hand writing in a notebook with a pen at a sunlit desk', tone: '#403d39', to: { q: 'writing' } },
  { slug: 'admin-support', name: 'Admin & Support', description: 'Virtual assistance, customer service, and operations.', image: '/img/categories/admin-support.png', alt: 'Four people joining hands over a desk of papers, a team working together', tone: '#eb5e28', to: { category: A } },
  { slug: 'finance-accounting', name: 'Finance & Accounting', description: 'Bookkeeping, financial analysis, and accounting.', image: '/img/categories/finance-accounting.png', alt: 'A calculator lying on printed charts and graphs', tone: '#ccc5b9', to: { q: 'data analysis' } },
  { slug: 'legal', name: 'Legal', description: 'Legal research, documentation, and professional legal services.', image: '/img/categories/legal.png', alt: 'A bronze statue of Lady Justice holding scales and a sword', tone: '#403d39', to: { category: B } },
  { slug: 'hr-training', name: 'HR & Training', description: 'Recruitment, training, talent development, and HR support.', image: '/img/categories/hr-training.png', alt: 'Three women in a meeting around a white table in a bright office', tone: '#eb5e28', to: { q: 'project management' } },
  { slug: 'engineering-architecture', name: 'Engineering & Architecture', description: 'Architecture, CAD, engineering, and technical design.', image: '/img/categories/engineering-architecture.png', alt: 'Engineers in hard hats and safety vests inspecting a building site from the roof', tone: '#ccc5b9', to: { category: E } },
];

export const EXAMPLES: Record<Intent, string[]> = {
  hire: ['Website development', 'Brand identity design', 'Video editing', 'Digital marketing', 'Content writing'],
  work: ['Frontend development projects', 'UI/UX design projects', 'Content writing jobs', 'Video editing projects', 'Marketing opportunities'],
};

// Sample services shown in the search suggestions, next to the domains and topics.
const SAMPLE_SERVICES = [
  'Brand identity design', 'Website development', 'Landing page design', 'Logo design', 'Social media management',
  'Content writing', 'AI automation', 'Video editing', 'SEO audit', 'WordPress setup', 'Product photography',
  'Explainer animation', 'Data entry', 'Excel data analysis', 'AutoCAD floor plans', 'Customer service replies',
];

export interface Suggestion { id: string; label: string; kind: 'Category' | 'Topic' | 'Service'; to: Destination }

// One entry per label (ignoring case): domains first, then topics, then sample services.
export const SUGGESTIONS: Suggestion[] = [
  ...SERVICES.map((d) => ({ id: `cat-${d.name}`, label: d.name, kind: 'Category' as const, to: { category: d.name } })),
  ...SERVICES.flatMap((d) => d.topics.map((t) => ({ id: `topic-${t}`, label: t, kind: 'Topic' as const, to: { q: t } }))),
  ...SAMPLE_SERVICES.map((s) => ({ id: `svc-${s}`, label: s, kind: 'Service' as const, to: { q: s } })),
].filter((s, i, all) => all.findIndex((x) => x.label.toLowerCase() === s.label.toLowerCase()) === i);

export interface Step { title: string; text: string; image: string; alt: string }

export const HOW: Record<Intent, Step[]> = {
  hire: [
    { title: 'Post jobs for free', text: 'Describe your project, outline your requirements, and start connecting with professionals who can bring your ideas to life.', image: '/img/how/post-job.svg', alt: 'A job post being written on a laptop, with a budget and a deadline' },
    { title: 'Get proposals and hire', text: 'Compare skills, portfolios, timelines, and proposals to find the right freelancer for your project.', image: '/bg/role-client-photo.png', alt: 'A client shaking hands with a freelancer across a desk' },
    { title: 'Pay when work is done', text: 'Agree on deliverables and milestones, collaborate throughout the project, and pay according to your agreed terms.', image: '/img/how/pay-on-delivery.svg', alt: 'A milestone list with two items approved and one in review' },
  ],
  work: [
    { title: 'Showcase your skills', text: 'Create your profile, highlight your expertise, and build a portfolio that helps clients understand what you do best.', image: '/bg/role-freelancer-photo.webp', alt: 'A designer at a desk working on a colour palette on a wide monitor' },
    { title: 'Find projects and send proposals', text: 'Explore opportunities that match your skills, review project requirements, and send tailored proposals to potential clients.', image: '/img/how/find-projects.svg', alt: 'A list of project briefs with one opened and a proposal being written' },
    { title: 'Deliver great work and get paid', text: 'Collaborate with clients, meet agreed milestones, submit your deliverables, and receive payment according to the agreed terms.', image: '/img/how/deliver.svg', alt: 'A finished design handed over, with the milestone marked ready for approval' },
  ],
};

// Sample profiles. They match the sample freelancers in the demo data, so "View profile" opens a real page.
export interface Talent { id: string; name: string; role: string; skills: string[]; intro: string; rate: number }
export const TALENT: Talent[] = [
  { id: 'u_freelancer3', name: 'Asha Rao', role: 'Full-stack developer', skills: ['React', 'Node.js', 'PostgreSQL'], intro: 'Builds web apps and APIs for small teams, with tests and a handover call.', rate: 1500 },
  { id: 'u_freelancer10', name: 'Sneha Reddy', role: 'Graphic designer', skills: ['Graphic Design', 'Photoshop', 'Illustrator'], intro: 'Posters, packaging and social posts for shops and studios. Source files included.', rate: 950 },
  { id: 'u_freelancer5', name: 'Meera Iyer', role: 'Video editor', skills: ['Video editing', 'After Effects', 'Animation'], intro: 'Short social and brand films, from rough cut to captions and music.', rate: 900 },
  { id: 'u_freelancer9', name: 'Karan Mehta', role: 'PHP developer', skills: ['PHP', 'MySQL', 'eCommerce'], intro: 'Custom PHP sites, booking forms and admin pages, with clear handover notes.', rate: 1100 },
];

// The hero background. Add a muted, licensed clip as video (for example /video/hero-1.mp4) and it plays
// over the poster; without one, the posters crossfade. Both images are the team's own uploads.
export interface HeroSlide { poster: string; alt: string; video?: string }
export const HERO_SLIDES: HeroSlide[] = [
  { poster: '/bg/role-freelancer-photo.webp', alt: '' },
  { poster: '/bg/role-client-photo.png', alt: '' },
];
