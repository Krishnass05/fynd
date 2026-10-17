'use client';
// The freelancer's first page, laid out like the client home. The reviews are SAMPLE text written for
// the demo, not real freelancers. OWNER: Krishna.
import MarketHome from '@/components/home/MarketHome';
import type { Review } from '@/components/reviews/ReviewCarousel';

const CHIPS = ['Web Development', 'Logo Design', 'Video Editing', 'SEO', 'Data Entry', 'Graphic Design'];

const REVIEWS: Review[] = [
  { name: 'Karthik R.', role: 'Web developer, Hyderabad', text: 'Every extra ask arrives as a priced change order. I stopped doing free work and nobody argued.', rating: 5 },
  { name: 'Sana P.', role: 'Logo designer, Pune', text: 'The signed scope is on record, so when a client wants more, the answer is already written down.', rating: 5 },
  { name: 'Mohan L.', role: 'Video editor, Chennai', text: 'I see my capacity before I say yes. I do not overbook any more.', rating: 4 },
  { name: 'Divya N.', role: 'CAD designer, Kochi', text: 'Milestones are approved one by one, so I know what the client has accepted.', rating: 5 },
  { name: 'Faisal A.', role: 'Data entry specialist, Lucknow', text: 'A rejected change stays rejected, and it is not counted against my hours.', rating: 4 },
  { name: 'Ritu G.', role: 'SEO consultant, Mumbai', text: 'Finding jobs is quick, and the messages stay with the project instead of getting lost in email.', rating: 5 },
];

export default function FreelancerHome() {
  return (
    <MarketHome
      eyebrow="Get paid for every extra ask"
      title="Find your next job."
      lead="Search open jobs across design, development, writing, marketing and more. Every change a client asks for is priced and approved in writing before you start."
      placeholder="Search for a job, like logo design or PHP"
      searchLabel="Search jobs"
      searchPath="/freelancer/jobs"
      chips={CHIPS}
      reviewsTitle="What freelancers say"
      reviewsNote="Sample reviews written for this demo. They are not from real freelancers."
      reviewsLabel="Freelancer reviews"
      reviews={REVIEWS}
    />
  );
}
