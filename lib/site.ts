// Site-wide content for the footer and the About page: one place to edit. OWNER: Krishna.
// Nothing here is invented: team names, bios, photos and social links stay null until the team supplies them.

export const TAGLINE = 'Great work starts with the right connection.';
export const DESCRIPTION =
  'Crewmate connects talented freelancers with clients to bring ideas to life, with every extra request priced and agreed before the work starts.';

// Social profiles. url: null = no official account yet; the footer shows the icon as "coming soon", not as a link.
export type SocialId = 'linkedin' | 'instagram' | 'x' | 'youtube';
export const SOCIAL: Array<{ id: SocialId; label: string; url: string | null }> = [
  { id: 'linkedin', label: 'LinkedIn', url: null },
  { id: 'instagram', label: 'Instagram', url: null },
  { id: 'x', label: 'X (Twitter)', url: null },
  { id: 'youtube', label: 'YouTube', url: null },
];

// The founding team: six proposed roles (not verified appointments). Fill in name, bio and photo
// (a file in public/team/, for example '/team/ceo.jpg') when the team supplies them.
export interface TeamMember {
  role: string; // short title
  title: string; // full designation
  focus: string; // what the role covers at Crewmate (a description of the role, not of a person)
  name: string | null;
  bio: string | null;
  photo: string | null;
}
export const TEAM: TeamMember[] = [
  { role: 'CEO', title: 'Chief Executive Officer', focus: 'Sets the direction, owns the product vision and the first customers.', name: null, bio: null, photo: null },
  { role: 'COO', title: 'Chief Operating Officer', focus: 'Runs day-to-day operations, support and the freelancer and client experience.', name: null, bio: null, photo: null },
  { role: 'CTO', title: 'Chief Technology Officer', focus: 'Leads the platform, the rules engine, security and the engineering team.', name: null, bio: null, photo: null },
  { role: 'CFO', title: 'Chief Financial Officer', focus: 'Owns pricing, unit economics, cost to serve and financial planning.', name: null, bio: null, photo: null },
  { role: 'Director of Operations', title: 'Director of Operations', focus: 'Builds the processes that keep projects, payments and disputes on track.', name: null, bio: null, photo: null },
  { role: 'Director of Marketing and Growth', title: 'Director of Marketing and Growth', focus: 'Finds the first agencies and freelancers and runs the growth experiments.', name: null, bio: null, photo: null },
];
