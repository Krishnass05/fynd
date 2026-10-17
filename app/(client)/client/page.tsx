'use client';
// The client's first page. The reviews are SAMPLE text written for the demo, not real customers. OWNER: Krishna.
import MarketHome from '@/components/home/MarketHome';
import type { Review } from '@/components/reviews/ReviewCarousel';

const CHIPS = ['Web Development', 'Logo Design', 'Video Editing', 'SEO', 'Data Entry', 'Graphic Design'];

const REVIEWS: Review[] = [
  { name: 'Anjali M.', role: 'Bakery owner, Hyderabad', text: 'I knew the price of every extra request before anyone started. No surprise bills at the end.', rating: 5 },
  { name: 'Rahul S.', role: 'Founder, small online shop', text: 'The signed scope sat right next to the new request, so it was easy to say yes to one thing and no to another.', rating: 5 },
  { name: 'Priya K.', role: 'Marketing lead, startup', text: 'Approving the work milestone by milestone kept the project calm. I always knew what was done.', rating: 4 },
  { name: 'Imran A.', role: 'Cafe owner, Pune', text: 'My logo designer and I stopped arguing about what was included. It was written down and priced.', rating: 5 },
  { name: 'Neha T.', role: 'Trainer, Bengaluru', text: 'I found a freelancer in minutes with the filters. The messages stayed in one place with the project.', rating: 5 },
  { name: 'Vikram D.', role: 'Agency account lead', text: 'Rejected changes stayed rejected. Nothing slipped into the budget quietly.', rating: 4 },
];

export default function ClientHome() {
  return (
    <MarketHome
      eyebrow="Hire with the scope agreed first"
      title="Find the right freelancer for the job."
      lead="Search skilled freelancers across design, development, writing, marketing and more. Every extra request is priced and approved by you before the work starts."
      placeholder="Search for a skill or a freelancer, like logo design or PHP"
      searchLabel="Search freelancers"
      searchPath="/client/freelancers"
      chips={CHIPS}
      reviewsTitle="What clients say"
      reviewsNote="Sample reviews written for this demo. They are not from real customers."
      reviewsLabel="Client reviews"
      reviews={REVIEWS}
    />
  );
}
