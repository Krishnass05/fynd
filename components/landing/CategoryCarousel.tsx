'use client';
// "Find freelancers for every type of work": a 3D coverflow of the ten categories. The active slide is
// large and flat, its neighbours turn away, and a colour wash sweeps to the active category's tone.
// Our own build (the paid React Bits Pro Prism Carousel needs a licence we do not have). Arrow keys,
// buttons, dots and clicking a side slide move it; clicking the active slide or "Explore category"
// opens the search for that category. No autoplay. OWNER: Krishna.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronRight } from '@/components/ui/icons';
import { CATEGORIES } from './data';
import { goSearch } from './goSearch';

export default function CategoryCarousel() {
  const router = useRouter();
  const n = CATEGORIES.length;
  const [active, setActive] = useState(1);
  const go = (i: number) => setActive(((i % n) + n) % n);
  const offset = (i: number) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };
  const cur = CATEGORIES[active];
  const explore = () => goSearch(router.push, 'hire', cur.to);

  return (
    <section className="cats" aria-labelledby="cats-title">
      <div className="lwrap">
        <h2 id="cats-title">Find freelancers for every type of work</h2>
        <p className="lsub">Explore the talent and skills you need to bring your next idea to life.</p>
      </div>
      <div
        className="ccar"
        role="group"
        aria-roledescription="carousel"
        aria-label="Categories"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
          if (e.key === 'Enter' && e.target === e.currentTarget) { e.preventDefault(); explore(); }
        }}
      >
        <div className="ccar-wash" aria-hidden="true">
          {CATEGORIES.map((c, i) => <span key={c.slug} style={{ background: `radial-gradient(55% 60% at 50% 45%, ${c.tone}, transparent 70%)`, opacity: i === active ? 0.22 : 0 }} />)}
        </div>
        <div className="ccar-stage">
          {CATEGORIES.map((c, i) => {
            const d = offset(i);
            const ad = Math.abs(d);
            return (
              <figure
                key={c.slug}
                className="ccar-slide"
                data-active={d === 0 || undefined}
                aria-hidden={d !== 0}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}: ${c.name}`}
                style={{ '--d': d, '--ad': ad, '--tone': c.tone, zIndex: 20 - ad, opacity: ad > 3 ? 0 : 1 - ad * 0.18, pointerEvents: ad > 3 ? 'none' : 'auto' } as React.CSSProperties}
                onClick={() => (d === 0 ? explore() : go(i))}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt={c.alt} loading="lazy" width={640} height={800} />
                <figcaption>
                  <span className="ccar-num">{String(i + 1).padStart(2, '0')}</span>
                  <strong>{c.name}</strong>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
      <div className="ccar-info" aria-live="polite">
        <div>
          <p className="ccar-count">{String(active + 1).padStart(2, '0')} / {n}</p>
          <h3>{cur.name}</h3>
          <p>{cur.description}</p>
        </div>
        <div className="ccar-controls">
          <button type="button" className="ccar-btn" aria-label="Previous category" onClick={() => go(active - 1)}><span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}><ChevronRight size={20} /></span></button>
          <button type="button" className="ccar-btn" aria-label="Next category" onClick={() => go(active + 1)}><ChevronRight size={20} /></button>
          <button type="button" className="btn dark" onClick={explore}>Explore {cur.name}</button>
        </div>
      </div>
      <div className="ccar-dots">
        {CATEGORIES.map((c, i) => (
          <button key={c.slug} type="button" aria-label={`Show ${c.name}`} aria-current={i === active ? 'true' : undefined} onClick={() => go(i)} />
        ))}
      </div>
    </section>
  );
}
