'use client';
// A coverflow carousel for the client reviews: the middle card is large and flat, the others turn away
// to the sides, and a soft colour wash sweeps to the tone of each new card. Our own plain-CSS version
// (the paid React Bits Prism Carousel is not used). Arrow keys, buttons and dots work; it pauses on
// hover and focus and does not move on its own for people who prefer reduced motion. OWNER: Krishna.
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Star } from '@/components/ui/icons';

export interface Review { name: string; role: string; text: string; rating: number }

const TONES = ['#eb5e28', '#ccc5b9', '#ffb703', '#403d39', '#f4a261', '#8d99ae'];

function Stars({ n }: { n: number }) {
  return (
    <span className="stars" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= n ? 'on' : 'off'}><Star size={16} /></span>)}
    </span>
  );
}

export default function ReviewCarousel({ reviews, label }: { reviews: Review[]; label: string }) {
  const n = reviews.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setStill(mq.matches);
    const on = () => setStill(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    if (paused || still) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % n), 5000);
    return () => window.clearInterval(id);
  }, [paused, still, n]);

  const go = (i: number) => setActive(((i % n) + n) % n);
  // Shortest signed distance from the active card, so the ring wraps around.
  const offset = (i: number) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <div
      ref={root}
      className="rcar"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="rcar-wash" aria-hidden="true">
        {reviews.map((r, i) => (
          <span key={r.name} style={{ background: `radial-gradient(60% 70% at 50% 50%, ${TONES[i % TONES.length]}, transparent 70%)`, opacity: i === active ? 0.16 : 0 }} />
        ))}
      </div>
      <div className="rcar-stage">
        {reviews.map((r, i) => {
          const d = offset(i);
          const ad = Math.abs(d);
          return (
            <figure
              key={r.name}
              className="rcar-card"
              aria-hidden={d !== 0}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
              data-active={d === 0 || undefined}
              style={{ '--d': d, '--ad': ad, '--tone': TONES[i % TONES.length], zIndex: 10 - ad, opacity: ad > 2 ? 0 : 1 - ad * 0.28, pointerEvents: ad > 2 ? 'none' : 'auto' } as React.CSSProperties}
              onClick={() => go(i)}
            >
              <Stars n={r.rating} />
              <blockquote>{r.text}</blockquote>
              <figcaption><strong>{r.name}</strong><span>{r.role}</span></figcaption>
            </figure>
          );
        })}
      </div>
      <div className="rcar-controls">
        <button type="button" className="rcar-btn" aria-label="Previous review" onClick={() => go(active - 1)}><span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}><ChevronRight size={20} /></span></button>
        <div className="rcar-dots">
          {reviews.map((r, i) => (
            <button key={r.name} type="button" aria-label={`Show review ${i + 1} of ${n}`} aria-current={i === active ? 'true' : undefined} onClick={() => go(i)} />
          ))}
        </div>
        <button type="button" className="rcar-btn" aria-label="Next review" onClick={() => go(active + 1)}><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}
