'use strict';
// Help assistant: answers common questions from clients and freelancers using this site's own guide.
// It is rule-based (keyword matching against a written guide), works offline, and never makes things up:
// if nothing matches well it says so and offers topics. It is NOT a language model. Plain JavaScript, tested.

// roles: who the answer is for ('client', 'freelancer', or both). keys: words and phrases that point to it.
const GUIDE = [
  {
    id: 'post-job', roles: ['client'], title: 'Post a job',
    keys: ['post a job', 'create job', 'new job', 'hire someone', 'start a job', 'publish job', 'post job', 'budget', 'deadline'],
    answer: 'Open the Jobs menu and choose Post a job. It has three steps: the details (title and description), the budget and deadline, then a review. Freelancers can then find your job and apply.',
    links: [{ label: 'Post a job', href: '/client/jobs/new' }],
  },
  {
    id: 'applicants', roles: ['client'], title: 'Review applicants and hire',
    keys: ['applicants', 'applications', 'proposals', 'compare', 'accept', 'hire', 'choose freelancer', 'select freelancer', 'who applied'],
    answer: 'Go to Jobs, then My jobs, and open the job. You will see every applicant side by side with price, how it compares to your budget, skills and pitch. Click a name to open their profile, press Accept to hire, or Remove to turn an applicant down. Accepting closes the job, turns down the others and opens a project.',
    links: [{ label: 'My jobs', href: '/client/jobs' }],
  },
  {
    id: 'remove-applicant', roles: ['client'], title: 'Remove an applicant',
    keys: ['remove', 'remove applicant', 'remove an applicant', 'remove a freelancer', 'reject applicant', 'decline applicant', 'turn down', 'not interested'],
    answer: 'On the job page, press Remove next to an applicant. They see their application as rejected and the job stays open for others. You cannot undo it.',
    links: [{ label: 'My jobs', href: '/client/jobs' }],
  },
  {
    id: 'milestones', roles: ['client', 'freelancer'], title: 'Milestones',
    keys: ['milestone', 'milestones', 'split', 'installments', 'stages', 'approve milestone', 'mark ready'],
    answer: 'When the client accepts a freelancer, the price is split into milestones (30/40/30 by default, and the client can change it as long as it adds up exactly). The freelancer marks a milestone ready, and the client approves it. This is a record only: no money moves through the site.',
    links: [],
  },
  {
    id: 'sow-freelancer', roles: ['freelancer'], title: 'Upload the signed SOW',
    keys: ['upload sow', 'signed sow', 'sow', 'statement of work', 'agreement', 'baseline', 'scope document'],
    answer: 'Open your project from the dashboard (avatar menu, then Dashboard) and use the card "Upload the signed SOW". It takes a .txt or .md file, and there can be only one signed SOW per project. It becomes the baseline that later requests are compared with. PDF files are not read yet.',
    links: [{ label: 'My dashboard', href: '/freelancer/dashboard' }],
  },
  {
    id: 'sow-client', roles: ['client'], title: 'Ask for more work (amended SOW)',
    keys: ['amended sow', 'amendment', 'more work', 'extra work', 'additional', 'change request', 'add feature', 'new request', 'ask for more'],
    answer: 'Open the project and use "Ask for more work" to upload the amended SOW (.txt or .md). It appears after the freelancer has uploaded the signed SOW. The site compares the two documents and turns each new item into a change order with a price.',
    links: [{ label: 'My dashboard', href: '/client/dashboard' }],
  },
  {
    id: 'extra-work-freelancer', roles: ['freelancer'], title: 'When a client wants extra work',
    keys: ['client wants extra work', 'client wants more', 'extra work', 'client asks for more', 'client changed', 'scope creep', 'new request from client', 'change order'],
    answer: 'Only the client can ask for more work: they upload an amended SOW on the project. You do not upload it. The site compares it with your signed SOW and turns each new item into a change order priced as hours times your rate, before tax. The client then approves or rejects each one, and you can see the status on your dashboard and project page. Approved changes use up your available hours, and a rejected one is never booked.',
    links: [{ label: 'My dashboard', href: '/freelancer/dashboard' }],
  },
  {
    id: 'pricing', roles: ['client', 'freelancer'], title: 'How a change is priced',
    keys: ['price', 'pricing', 'cost', 'estimate', 'how much', 'rate', 'hours', 'charge', 'quote', '6000', 'before tax'],
    answer: 'A change is priced as hours times the hourly rate in the signed SOW, before tax. For example, six extra hours at Rs 1000 an hour is Rs 6000 before tax. Tax is shown separately and is not added to the amount. If the hours are not given, the item is not priced until someone clarifies it: unknown is never treated as zero.',
    links: [],
  },
  {
    id: 'approve-reject', roles: ['client', 'freelancer'], title: 'Approve or reject a change',
    keys: ['approve', 'reject', 'decline change', 'change order', 'decision', 'rejected change', 'approved'],
    answer: 'The client approves or rejects each change order, and can add a reason. Only approved changes count as committed work and value. A rejected change is never booked, and it can be reopened later with a reason. Approving fails if it would go over the available hours.',
    links: [],
  },
  {
    id: 'repeat-upload', roles: ['client', 'freelancer'], title: 'Uploading the same document twice',
    keys: ['upload twice', 'same document', 'repeat', 'duplicate', 'double charge', 'charged twice', 'again'],
    answer: 'Uploading the same document again changes nothing. The site recognises identical content, so a request is never charged or booked twice. A changed document is saved as a new version.',
    links: [],
  },
  {
    id: 'capacity', roles: ['freelancer', 'client'], title: 'Hours and capacity',
    keys: ['capacity', 'available hours', 'utilization', 'utilisation', 'over capacity', 'remaining hours', 'overbook'],
    answer: 'Each project has a fixed number of available hours. Approved changes and rework use them up, and the project page shows how much is left. A change that would go over the remaining hours cannot be approved.',
    links: [],
  },
  {
    id: 'defect', roles: ['freelancer', 'client'], title: 'Fixing your own mistake (rework)',
    keys: ['defect', 'rework', 'bug', 'fix', 'mistake', 'own fault', 'broken'],
    answer: 'Rework caused by the freelancer\'s own defect is booked against the hours but costs Rs 0. It is not billed as a change.',
    links: [],
  },
  {
    id: 'find-freelancers', roles: ['client'], title: 'Find freelancers',
    keys: ['find freelancer', 'search freelancer', 'browse', 'find talent', 'look for', 'filter', 'find someone', 'search'],
    answer: 'Use the search box at the top, or open Find freelancers. You can filter by domain, skill, hourly rate and availability, open any profile to see previous work and reviews, and save people you like with the heart.',
    links: [{ label: 'Find freelancers', href: '/client/freelancers' }],
  },
  {
    id: 'find-jobs', roles: ['freelancer'], title: 'Find jobs and apply',
    keys: ['find job', 'search job', 'apply', 'open jobs', 'find work', 'proposal', 'pitch', 'look for work'],
    answer: 'Use the search box at the top or open Jobs, then Find jobs. Open a job to read it and the client\'s profile, then send a short pitch and your price in whole rupees. You can apply to a job once.',
    links: [{ label: 'Find jobs', href: '/freelancer/jobs' }],
  },
  {
    id: 'services', roles: ['client', 'freelancer'], title: 'Services and domains',
    keys: ['services', 'domains', 'categories', 'topics', 'what do you offer', 'what kind of'],
    answer: 'The Services menu lists the five domains (Websites, IT and Software; Design, Media and Architecture; Engineering and Science; Business, Accounting, Human Resources and Legal; Data Entry and Admin). Hover one to see its topics, and click a domain or topic to search it.',
    links: [],
  },
  {
    id: 'profiles', roles: ['client', 'freelancer'], title: 'Profiles, ratings and reviews',
    keys: ['profile', 'rating', 'review', 'reviews', 'previous work', 'portfolio', 'company', 'worked with', 'edit profile'],
    answer: 'A freelancer\'s profile shows previous work, who they have worked with, and reviews with a rating. A client\'s profile shows company details, a rating and reviews from freelancers. Open yours from the avatar menu, then Profile. Freelancers can edit theirs with Edit profile. In this demo all reviews are made-up samples, and writing a review is not built yet.',
    links: [],
  },
  {
    id: 'chat', roles: ['client', 'freelancer'], title: 'Project chat and privacy',
    keys: ['chat', 'message', 'messages', 'phone number', 'email address', 'contact details', 'redacted', 'hidden', 'share number', 'whatsapp'],
    answer: 'The project chat is for both people on the project. To keep work and payments on the platform, the server hides phone numbers (also when written in words), email addresses, links and social handles before a message is saved, and shows a notice. Asking to talk elsewhere is flagged.',
    links: [],
  },
  {
    id: 'calls', roles: ['client', 'freelancer'], title: 'Voice and video calls',
    keys: ['call', 'calls', 'voice call', 'video call', 'video', 'phone call', 'speak', 'talk', 'microphone', 'camera', 'ended'],
    answer: 'Open a project and use Voice call or Video call. The other person gets a ring and can answer or decline. Calls are watched live: your speech is turned into text and checked, and the call is ended for both people if a phone number, email, link or social handle is said, even in words. Calls need Chrome or Edge and microphone permission.',
    links: [],
  },
  {
    id: 'payments', roles: ['client', 'freelancer'], title: 'Payments',
    keys: ['payment', 'pay', 'paid', 'money', 'escrow', 'refund', 'invoice', 'transfer', 'wallet'],
    answer: 'No money moves through this site. Milestones and approvals are recorded so both sides agree on what is done and what it costs, but paying is arranged between you. There is no escrow or payment protection.',
    links: [],
  },
  {
    id: 'switch', roles: ['client', 'freelancer'], title: 'Using both sides with one account',
    keys: ['switch', 'both sides', 'client and freelancer', 'one account', 'change role', 'other side'],
    answer: 'An account that has both sides can switch with Switch to Freelancer or Switch to Client in the avatar menu. If you signed up for only one side, the same menu shows Create freelancer account (or Create client account): it adds the other side to your login, with no new email or password. When you sign up you can also choose Both. The shared demo accounts cannot add a side, but both@demo.test (password demo1234) already has both.',
    links: [],
  },
  {
    id: 'login', roles: ['client', 'freelancer'], title: 'Logging in',
    keys: ['login', 'log in', 'sign in', 'sign up', 'register', 'account', 'password', 'demo account'],
    answer: 'Use Log in or Sign up on the home page. To create an account, choose Sign up, pick whether you want to hire, work or both, and set a password of at least 8 characters with a letter and a number. You can also continue with Google if it is switched on. To look around quickly, the Log in page lists demo accounts with a Fill in button (the shared password is demo1234). Email confirmation and password reset are not available yet.',
    links: [{ label: 'Log in', href: '/login' }],
  },
  {
    id: 'dashboard', roles: ['client', 'freelancer'], title: 'Dashboard and menus',
    keys: ['dashboard', 'avatar', 'logout', 'log out', 'menu', 'where is', 'how do i find', 'home page'],
    answer: 'Click your initials in the top right. The menu has Profile, Dashboard, Switch (if your account has both sides) and Log out. The Jobs and Services menus are in the top bar.',
    links: [],
  },
  {
    id: 'urgent', roles: ['client', 'freelancer'], title: 'Urgent requests',
    keys: ['urgent', 'rush', 'asap', 'deadline', 'quick', 'faster', 'surcharge'],
    answer: 'A rush surcharge for urgent requests is not built yet. Today an urgent change is priced like any other: hours times rate, before tax.',
    links: [],
  },
  {
    id: 'files', roles: ['client', 'freelancer'], title: 'File types',
    keys: ['pdf', 'file', 'format', 'upload', 'docx', 'word document', 'txt', 'markdown'],
    answer: 'SOW uploads accept .txt and .md files. PDF reading is not available yet. The sample files docs/demo/signed-sow.txt and amended-sow.txt show the expected layout: headings such as Deliverables and Excluded, then bullet lines with hours in brackets.',
    links: [],
  },
  {
    id: 'legal', roles: ['client', 'freelancer'], title: 'Is this legal advice?',
    keys: ['legal', 'contract', 'lawyer', 'binding', 'court', 'law', 'synthetic', 'real data', 'demo'],
    answer: 'No. This is a workflow aid, not legal advice, and an approval here is not a signed contract. All data in this demo is synthetic: the people, companies, prices and reviews are made up.',
    links: [],
  },
];

const STOP = new Set(['how', 'do', 'i', 'can', 'the', 'a', 'an', 'to', 'is', 'it', 'my', 'me', 'we', 'you', 'of', 'in', 'on', 'for', 'and', 'or', 'what', 'where', 'does', 'this', 'that', 'with', 'are', 'be', 'if', 'there', 'please', 'want', 'need', 'about', 'will', 'should']);

const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const stem = (w) => w.replace(/(ing|ed|es|s)$/, '');

function score(entry, q, qWords) {
  let s = 0;
  for (const key of entry.keys) {
    if (key.includes(' ')) { if (q.includes(key)) s += 4; continue; }
    const k = stem(key);
    if (qWords.some((w) => stem(w) === k)) s += 2;
  }
  return s;
}

const GREETING = /^(hi|hello|hey|hii|namaste|good (morning|afternoon|evening))\b/i;
const THANKS = /^(thanks|thank you|thx|ok thanks|great|cool)\b/i;

function suggestions(role) {
  const pick = (ids) => ids.map((id) => GUIDE.find((e) => e.id === id)).filter(Boolean).map((e) => ({ id: e.id, title: e.title }));
  return role === 'freelancer'
    ? pick(['find-jobs', 'sow-freelancer', 'pricing', 'approve-reject', 'chat', 'calls'])
    : role === 'client'
      ? pick(['post-job', 'applicants', 'sow-client', 'pricing', 'chat', 'calls'])
      : pick(['login', 'pricing', 'chat', 'calls', 'payments', 'legal']);
}

// answer(question, role): role is 'client', 'freelancer' or anything else (a visitor who is not signed in).
function answer(question, role) {
  const text = String(question ?? '').trim().slice(0, 300);
  if (!text) return { text: 'Ask me anything about posting jobs, applying, SOWs, change orders, chat, calls or profiles.', links: [], topics: suggestions(role) };
  if (GREETING.test(text) && text.split(/\s+/).length <= 3) return { text: 'Hello! I can help with how this site works. Pick a topic below or type your question.', links: [], topics: suggestions(role) };
  if (THANKS.test(text) && text.split(/\s+/).length <= 4) return { text: 'You are welcome. Ask me anything else about the site.', links: [], topics: suggestions(role) };

  const q = text.toLowerCase();
  const qWords = words(q).filter((w) => !STOP.has(w));
  const ranked = GUIDE
    .map((e) => {
      // an answer written for the other side is worth less, so each person gets the answer meant for them
      const mine = role === 'client' || role === 'freelancer' ? e.roles.includes(role) : true;
      return { e, s: score(e, q, qWords) * (mine ? 1 : 0.4) };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  if (!ranked.length || ranked[0].s < 2) {
    return { text: 'I am not sure about that one. I only know how this site works, so try asking about one of these topics, or use the Help links in the menu.', links: [], topics: suggestions(role) };
  }
  const best = ranked[0].e;
  const others = ranked.slice(1, 3).filter((x) => x.s >= ranked[0].s * 0.6).map((x) => ({ id: x.e.id, title: x.e.title }));
  return { text: best.answer, links: best.links, topics: others, matched: best.id };
}

function answerFor(id) {
  const e = GUIDE.find((x) => x.id === id);
  return e ? { text: e.answer, links: e.links, topics: [], matched: e.id } : null;
}

module.exports = { answer, answerFor, suggestions, GUIDE };
