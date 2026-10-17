'use client';
// The client's first page: a headline, a short description and a big search box in the middle,
// then reviews from other clients as a coverflow carousel. OWNER: Krishna (look follows the joveo.com home page).
// The reviews are SAMPLE text written for the demo, not real customers.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import BlurText from '@/components/fx/BlurText';
import { Search } from '@/components/ui/icons';
import ReviewCarousel, { type Review } from '@/components/reviews/ReviewCarousel';

const POPULAR = ['Web Development', 'Logo Design', 'Video Editing', 'SEO', 'Data Entry', 'Graphic Design'];

const REVIEWS: Review[] = [
  { name: 'Anjali M.', role: 'Bakery owner, Hyderabad', text: 'I knew the price of every extra request before anyone started. No surprise bills at the end.', rating: 5 },
  { name: 'Rahul S.', role: 'Founder, small online shop', text: 'The signed scope sat right next to the new request, so it was easy to say yes to one thing and no to another.', rating: 5 },
  { name: 'Priya K.', role: 'Marketing lead, startup', text: 'Approving the work milestone by milestone kept the project calm. I always knew what was done.', rating: 4 },
  { name: 'Imran A.', role: 'Cafe owner, Pune', text: 'My logo designer and I stopped arguing about what was included. It was written down and priced.', rating: 5 },
  { name: 'Neha T.', role: 'Trainer, Bengaluru', text: 'I found a freelancer in minutes with the filters. The messages stayed in one place with the project.', rating: 5 },
  { name: 'Vikram D.', role: 'Agency account lead', text: 'Rejected changes stayed rejected. Nothing slipped into the budget quietly.', rating: 4 },
];

export default function ClientHome() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const go = (value: string) => router.push(value.trim() ? `/client/freelancers?q=${encodeURIComponent(value.trim())}` : '/client/freelancers');

  return (
    <>
      <section className="chero" aria-labelledby="chero-title">
        <p className="eyebrow">Hire with the scope agreed first</p>
        <h1 id="chero-title">
          <BlurText text="Find the right freelancer for the job." trigger="load" animateBy="words" direction="top" delay={90} stepDuration={0.4} />
        </h1>
        <p className="lead">Search skilled freelancers across design, development, writing, marketing and more. Every extra request is priced and approved by you before the work starts.</p>
        <form className="bigsearch" role="search" onSubmit={(e) => { e.preventDefault(); go(q); }}>
          <Search size={20} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a skill or a freelancer, like logo design or PHP" aria-label="Search freelancers" />
          <button type="submit" className="btn">Search</button>
        </form>
        <div className="chero-chips">
          <span>Popular:</span>
          {POPULAR.map((t) => <button key={t} type="button" className="chip" onClick={() => go(t)}>{t}</button>)}
        </div>
      </section>

      <section className="reviews" aria-labelledby="reviews-title">
        <h2 id="reviews-title">What clients say</h2>
        <p className="muted">Sample reviews written for this demo. They are not from real customers.</p>
        <ReviewCarousel reviews={REVIEWS} label="Client reviews" />
      </section>
    </>
  );
}
