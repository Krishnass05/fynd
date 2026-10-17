'use client';
// The first page of each side: a headline, a short description and a big search box in the middle,
// popular searches, then reviews as a coverflow carousel. The same layout serves clients (search
// freelancers) and freelancers (search jobs). OWNER: Krishna (look follows the joveo.com home page).
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import BlurText from '@/components/fx/BlurText';
import ReviewCarousel, { type Review } from '@/components/reviews/ReviewCarousel';
import { Search } from '@/components/ui/icons';

export interface MarketHomeProps {
  eyebrow: string;
  title: string;
  lead: string;
  placeholder: string;
  searchLabel: string;
  searchPath: string; // where a search goes, with ?q=
  chips: string[];
  reviewsTitle: string;
  reviewsNote: string;
  reviewsLabel: string;
  reviews: Review[];
}

export default function MarketHome(p: MarketHomeProps) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const go = (value: string) => router.push(value.trim() ? `${p.searchPath}?q=${encodeURIComponent(value.trim())}` : p.searchPath);
  return (
    <>
      <section className="chero" aria-labelledby="chero-title">
        <p className="eyebrow">{p.eyebrow}</p>
        <h1 id="chero-title">
          <BlurText text={p.title} trigger="load" animateBy="words" direction="top" delay={90} stepDuration={0.4} />
        </h1>
        <p className="lead">{p.lead}</p>
        <form className="bigsearch" role="search" onSubmit={(e) => { e.preventDefault(); go(q); }}>
          <Search size={20} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={p.placeholder} aria-label={p.searchLabel} />
          <button type="submit" className="btn">Search</button>
        </form>
        <div className="chero-chips">
          <span>Popular:</span>
          {p.chips.map((t) => <button key={t} type="button" className="chip" onClick={() => go(t)}>{t}</button>)}
        </div>
      </section>

      <section className="reviews" aria-labelledby="reviews-title">
        <h2 id="reviews-title">{p.reviewsTitle}</h2>
        <p className="muted">{p.reviewsNote}</p>
        <ReviewCarousel reviews={p.reviews} label={p.reviewsLabel} />
      </section>
    </>
  );
}
