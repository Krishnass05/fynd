// Help content for the two account types. It describes features that exist in Crewmate today. OWNER: Krishna.
export type HelpRole = 'client' | 'freelancer';

export const HELP: Record<HelpRole, { title: string; intro: string; start: { label: string; href: string }; topics: Array<{ q: string; a: string }> }> = {
  client: {
    title: 'Help for clients',
    intro: 'For people posting projects, finding freelancers, managing projects and their account.',
    start: { label: 'Go to your client home', href: '/client' },
    topics: [
      { q: 'How do I find a freelancer?', a: 'Use Find freelancers (or the search bar) to filter by category, skill, rate and availability. Open a profile to see previous work and reviews, and save people to your shortlist.' },
      { q: 'How do I post a job and hire?', a: 'Choose Post a job, describe the work, budget and deadline. Freelancers apply with a price. On the job page compare applicants side by side, then Accept one and split the price into milestones.' },
      { q: 'How does the SOW work?', a: 'On the project page, upload your Statement of Work (.txt or .md; a sample and format guide are on the upload box). The freelancer reviews it as a table and fills in hours; if they change hours you confirm them. Only then is it the signed scope.' },
      { q: 'How do I ask for something extra?', a: 'Under Ask for a new task, write the request in plain English. Crewmate checks it against the signed scope; the freelancer accepts it as included, quotes a price, asks for details or declines. Nothing is charged until you both agree.' },
      { q: 'How do I follow progress?', a: 'Tasks and progress shows each task and a progress bar based on approved hours. Approve tasks the freelancer marks done, or send them back with a reason. Daily check-ins show what was done; you are warned after 2 days without one.' },
      { q: 'Can I use one account for both sides?', a: 'Yes. From the account menu (your initials, top right) you can create the freelancer side of your account or switch between both.' },
    ],
  },
  freelancer: {
    title: 'Help for freelancers',
    intro: 'For people offering services, managing their profile, finding projects, sending proposals and managing client relationships.',
    start: { label: 'Go to your freelancer home', href: '/freelancer' },
    topics: [
      { q: 'How do I set up my profile?', a: 'Open Profile to add your headline, overview, skills, hourly rate, location and availability. Clients see the changes straight away.' },
      { q: 'How do I find work and apply?', a: 'Use Find jobs or the search bar. Open a job and apply with a short pitch and your price. Your applications and their status are on your dashboard.' },
      { q: 'How do I review the client’s SOW?', a: 'When the client uploads the SOW, it appears on the project page as a table. Fill in or change the hours for each included row and approve it, or send it back with a reason.' },
      { q: 'How do I price a new request?', a: 'New requests from the client show a suggested label (included, excluded, new, defect or unclear). Answer with Already included, Our defect: fix free, Quote a price, Ask for details or Decline. A quote can be countered until one side accepts.' },
      { q: 'How do I report progress?', a: 'Start tasks and mark them done on the project page; the client approves them. Post one daily check-in with what you did, hours, blockers and tasks moved.' },
      { q: 'Why was my message hidden?', a: 'Phone numbers, email addresses, links and social handles (also when written in words) are hidden in chat and end a call, to keep work and payments on the platform.' },
    ],
  },
};
