// Small pieces shared by the freelancer and client profile pages: star rating, review list, previous work,
// and the summary box. All review and work content is sample data and is labelled that way. OWNER: Krishna.
import { Star } from '@/components/ui/icons';
import type { PortfolioItem, ReviewItem } from '@/lib/types';
import { EmptyState } from '@/components/ui';

export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= full ? 'on' : 'off'}><Star size={16} /></span>)}
    </span>
  );
}

export function RatingSummary({ rating, count, label }: { rating: number | null; count: number; label: string }) {
  return (
    <div className="ratingbox">
      <strong><Star size={18} /> {rating ? rating.toFixed(1) : 'New'}</strong>
      <div className="muted">{count} {count === 1 ? 'review' : 'reviews'} ({label})</div>
    </div>
  );
}

export function ReviewList({ reviews, empty }: { reviews: ReviewItem[]; empty: string }) {
  if (!reviews.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="reviewlist">
      {reviews.map((r) => (
        <li key={r.id} className="review">
          <div className="review-head">
            <Stars value={r.rating} />
            <strong>{r.fromName}</strong>
            <span className="muted">{r.fromCompany ? `${r.fromCompany} · ` : ''}{r.fromRole === 'client' ? 'Client' : 'Freelancer'}</span>
            <time className="muted" dateTime={r.date}>{r.date}</time>
          </div>
          <p className="review-text">{r.text}</p>
          <p className="muted review-project">On: {r.projectTitle}</p>
        </li>
      ))}
    </ul>
  );
}

export function PortfolioList({ items, empty }: { items: PortfolioItem[]; empty: string }) {
  if (!items.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="worklist">
      {items.map((p) => (
        <li key={p.id} className="work">
          <div className="work-top"><strong>{p.title}</strong><span className="muted">{p.year}</span></div>
          <p>{p.description}</p>
          <p className="muted work-client">For {p.clientName}</p>
          <ul className="fcard-chips" aria-label="Skills used">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
        </li>
      ))}
    </ul>
  );
}

export function SampleNote({ children }: { children: React.ReactNode }) {
  return <p className="muted" style={{ marginTop: 12 }}>{children}</p>;
}
