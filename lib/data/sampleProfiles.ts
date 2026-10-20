// Sample profile content for the demo: previous work, past clients, reviews and company details.
// Every name, company, review and rating here is MADE UP. The pages label it as sample content.
// OWNER: Krishna.
import type { CompanyInfo, PortfolioItem, ReviewItem } from '@/lib/types';

const w = (id: string, title: string, description: string, clientName: string, year: number, tags: string[]): PortfolioItem => ({ id, title, description, clientName, year, tags });

// Previous work, by freelancer id.
export const PORTFOLIO: Record<string, PortfolioItem[]> = {
  u_freelancer1: [
    w('pw1-1', 'Landing page for a yoga studio', 'One-page site with class timetable and an enquiry form, built in WordPress.', 'Lotus Yoga Studio', 2026, ['WordPress', 'Web design']),
    w('pw1-2', 'Brochure site for a dental clinic', 'Five pages, mobile first, with a booking request form.', 'Smile Care Dental', 2025, ['HTML', 'Web design']),
  ],
  u_freelancer2: [
    w('pw2-1', 'Logo and colour palette for a bakery', 'Colour and one-colour logo versions plus a one-page style sheet.', 'Golden Crust Bakery', 2026, ['Logo design', 'Illustration']),
    w('pw2-2', 'Brand marks for a pop-up cafe', 'Three logo directions, one chosen and finished in two revision rounds.', 'Brew & Beans Cafe', 2025, ['Logo design', 'Photoshop']),
  ],
  u_freelancer3: [
    w('pw3-1', 'Order tracking web app', 'React front end and a Node and PostgreSQL API for a small courier business.', 'Swift Couriers', 2026, ['React', 'Node.js', 'PostgreSQL']),
    w('pw3-2', 'Payment API integration', 'Connected a store to a payment provider with retries and test cover.', 'Northwind Learning', 2025, ['API integration', 'JavaScript']),
  ],
  u_freelancer4: [
    w('pw4-1', 'SEO clean-up for a bookshop', 'Fixed page titles, descriptions and speed. Organic visits grew over three months.', 'Page One Books', 2026, ['SEO', 'Content writing']),
    w('pw4-2', 'Blog plan for a trainer', 'Twelve-week content calendar and six written posts.', 'FitPath Training', 2025, ['Digital Marketing', 'Content writing']),
  ],
  u_freelancer5: [
    w('pw5-1', 'Product launch reel', 'Sixty-second reel from supplied clips, with captions and music.', 'Urban Threads', 2026, ['Video editing', 'After Effects']),
    w('pw5-2', 'Explainer animation', 'Thirty-second animated explainer from a script and a logo.', 'Northwind Learning', 2025, ['Animation', 'After Effects']),
  ],
  u_freelancer6: [
    w('pw6-1', 'Price tracker script', 'Python script that collects prices from five shops into a MySQL table.', 'DealFinder', 2026, ['Python', 'MySQL', 'Data collection']),
    w('pw6-2', 'Customer list clean-up', 'Merged and de-duplicated 8,000 records with a change log.', 'Swift Couriers', 2025, ['Python', 'Data collection']),
  ],
  u_freelancer7: [
    w('pw7-1', 'Interior renders for a flat', 'Six still renders of a living room in two styles.', 'Hearth Interiors', 2026, ['3D modelling', '3D rendering']),
    w('pw7-2', 'Product turntable', 'Modelled and rendered a ten-second turntable of a water bottle.', 'Clearwater Bottles', 2025, ['Blender', '3D rendering']),
  ],
  u_freelancer8: [
    w('pw8-1', 'Monthly social calendar', 'Thirty posts a month with captions and a short report.', 'Brew & Beans Cafe', 2026, ['Social media', 'Canva']),
    w('pw8-2', 'Festival campaign copy', 'Posts and short ad copy for a three-day festival.', 'City Arts Fest', 2025, ['Copywriting', 'Social media']),
  ],
  u_freelancer9: [
    w('pw9-1', 'Booking form for a salon', 'PHP and MySQL booking form with an admin page to cancel appointments.', 'Glow Salon', 2026, ['PHP', 'MySQL']),
    w('pw9-2', 'Small online shop', 'Catalogue, cart and order emails for a handmade goods seller.', 'Handmade Haven', 2025, ['PHP', 'eCommerce']),
  ],
  u_freelancer10: [
    w('pw10-1', 'Festival poster set', 'Three posters and matching social posts with source files.', 'City Arts Fest', 2026, ['Graphic Design', 'Photoshop']),
    w('pw10-2', 'Packaging for a tea brand', 'Box and label design for three flavours.', 'Chai Corner', 2025, ['Illustrator', 'Visual Design']),
  ],
  u_freelancer11: [
    w('pw11-1', 'Invoice data entry', 'Typed 400 scanned invoices into Excel and checked them twice.', 'Swift Couriers', 2026, ['Data Entry', 'Excel']),
    w('pw11-2', 'Support inbox replies', 'Answered weekday customer emails from a supplied answer sheet.', 'Handmade Haven', 2025, ['Customer Service', 'Data Processing']),
  ],
  u_freelancer12: [
    w('pw12-1', 'Floor plan for a small shop', 'Plan and one elevation from hand sketches, delivered as DWG and PDF.', 'Urban Threads', 2026, ['AutoCAD']),
    w('pw12-2', 'Bracket drawings', 'Part drawings for a small workshop with tolerances noted.', 'Precision Works', 2025, ['CAD/CAM', 'AutoCAD']),
  ],
  u_both1: [
    w('pwb-1', 'Website copy for a tea shop', 'Home, about and product pages written in a warm, plain voice.', 'Chai Corner', 2026, ['Copywriting', 'Content writing']),
    w('pwb-2', 'Six months of social posts', 'Weekly posts with captions and a short monthly report.', 'Golden Crust Bakery', 2025, ['Social media', 'Copywriting']),
  ],
  u_freelancer13: [
    w('pw13-1', 'Website build management', 'Six-week plan, weekly status reports and a risk list.', 'Northwind Learning', 2026, ['Project Management']),
    w('pw13-2', 'Sales analysis', 'Twelve months of sales in Excel with a one-page summary and three charts.', 'Page One Books', 2025, ['Data Analysis', 'Business Development']),
  ],
};

// Reviewers used for the made-up reviews (clients reviewing freelancers).
const CLIENT_REVIEWERS = [
  { name: 'Anjali M.', company: 'Golden Crust Bakery' },
  { name: 'Rahul S.', company: 'Handmade Haven' },
  { name: 'Priya K.', company: 'Northwind Learning' },
  { name: 'Imran A.', company: 'Brew & Beans Cafe' },
  { name: 'Neha T.', company: 'FitPath Training' },
  { name: 'Vikram D.', company: 'Swift Couriers' },
];
const FREELANCER_TEXT = [
  'Clear about what was included and what was extra. Delivered on the date we agreed.',
  'Quick replies and the work needed very few changes. Would hire again.',
  'Stuck to the scope and priced the one extra request fairly before starting.',
  'Good communication throughout. Handover notes were easy to follow.',
  'Solid work. A day late on one milestone, but told me in advance.',
  'Understood the brief the first time. Neat, careful work.',
];
const FREELANCER_RATINGS = [5, 5, 4, 5, 4, 5];

// Three made-up reviews per freelancer, picked by position so each profile reads differently.
export const REVIEWS: ReviewItem[] = [];
Object.entries(PORTFOLIO).forEach(([id, items], n) => {
  [0, 1, 2].forEach((k) => {
    const r = CLIENT_REVIEWERS[(n + k * 2) % CLIENT_REVIEWERS.length];
    const item = items[k % items.length];
    REVIEWS.push({
      id: `rv-${id}-${k}`,
      toId: id,
      fromName: r.name,
      fromRole: 'client',
      fromCompany: r.company,
      rating: FREELANCER_RATINGS[(n + k) % FREELANCER_RATINGS.length],
      text: FREELANCER_TEXT[(n * 2 + k) % FREELANCER_TEXT.length],
      date: `2026-0${3 + k}-1${(n % 8) + 1}`,
      projectTitle: item.title,
    });
  });
});

// Made-up reviews of the two sample clients, written by freelancers.
const clientReview = (id: string, to: string, name: string, rating: number, text: string, date: string, projectTitle: string): ReviewItem =>
  ({ id, toId: to, fromName: name, fromRole: 'freelancer', rating, text, date, projectTitle });
REVIEWS.push(
  clientReview('cv-1', 'u_client1', 'Karan M.', 5, 'Gave a clear brief and approved milestones the same day. Paid on the agreed terms.', '2026-04-12', 'Booking page for the cafe'),
  clientReview('cv-2', 'u_client1', 'Sneha R.', 4, 'Friendly and decisive. Asked for a couple of extras late, but they were priced and approved before I started.', '2026-05-03', 'Menu poster set'),
  clientReview('cv-3', 'u_client1', 'Meera I.', 5, 'Easy to work with. Feedback was specific and came in one round.', '2026-06-21', 'Opening-day reel'),
  clientReview('cv-b1', 'u_both1', 'Asha R.', 5, 'Clear brief and fair feedback. Paid on the agreed milestones.', '2026-04-02', 'Studio website'),
  clientReview('cv-b2', 'u_both1', 'Sneha R.', 4, 'Quick to approve work. One change came late but was priced first.', '2026-06-14', 'Brand sheet'),
  clientReview('cv-b3', 'u_both1', 'Karan M.', 5, 'Easy client who knows what they want.', '2026-07-19', 'Booking form'),
  clientReview('cv-4', 'u_client2', 'Asha R.', 4, 'Organised, and the scope matched the signed document. Replies took a day or two.', '2026-03-18', 'Course sign-up site'),
  clientReview('cv-5', 'u_client2', 'Farhan A.', 5, 'Clear instructions and quick approvals. Would work with again.', '2026-05-27', 'Invoice data entry'),
  clientReview('cv-6', 'u_client2', 'Divya N.', 4, 'Good client. Changed one requirement mid-way, and we handled it as a priced change.', '2026-07-08', 'Floor plan drawings'),
);

// Company details for the two sample clients (what a client enters when registering).
export const COMPANIES: Record<string, CompanyInfo> = {
  u_client1: {
    name: 'Brew & Beans Cafe',
    industry: 'Food and beverage',
    size: '2 to 10 people',
    location: 'Hyderabad, India',
    website: 'brewandbeans.example',
    about: 'A neighbourhood cafe that hires freelancers for its website, menus, posters and social media.',
    memberSince: '2026-01-14',
  },
  u_both1: {
    name: 'Quill & Co Studio',
    industry: 'Marketing and writing',
    size: '2 to 10 people',
    location: 'Bengaluru, India',
    website: 'quillandco.example',
    about: 'A small studio that writes for brands and hires designers and developers for its own projects.',
    memberSince: '2026-02-09',
  },
  u_client2: {
    name: 'Northwind Learning',
    industry: 'Education and training',
    size: '11 to 50 people',
    location: 'Pune, India',
    website: 'northwindlearning.example',
    about: 'A small training company that commissions websites, course material, data work and drawings.',
    memberSince: '2025-11-02',
  },
};
