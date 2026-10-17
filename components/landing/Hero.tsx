'use client';
// The cinematic hero: full-bleed background (video when supplied, otherwise crossfading photos) under a
// dark overlay, the headline, the Hire / Work toggle, the search and trending chips. The pause button
// stops the slideshow (and video). With reduced motion it shows one still frame. OWNER: Krishna.
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { EXAMPLES, HERO_SLIDES, TRENDING, type Destination, type Intent } from './data';
import { goSearch } from './goSearch';
import HeroSearch from './HeroSearch';
import Segmented from './Segmented';

const COPY: Record<Intent, { placeholder: string; action: string }> = {
  hire: { placeholder: 'What service are you looking for?', action: 'Find Talent' },
  work: { placeholder: 'Find projects that match your skills...', action: 'Find Work' },
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

function Background({ playing }: { playing: boolean }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const videos = useRef<Array<HTMLVideoElement | null>>([]);
  const moving = playing && !reduced && HERO_SLIDES.length > 1;

  useEffect(() => {
    if (!moving) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % HERO_SLIDES.length), 7000);
    return () => window.clearInterval(t);
  }, [moving]);
  useEffect(() => {
    videos.current.forEach((v, k) => {
      if (!v) return;
      if (k === i && playing && !reduced) v.play().catch(() => setBroken((b) => ({ ...b, [k]: true })));
      else v.pause();
    });
  }, [i, playing, reduced]);

  return (
    <div className="hero-bg" aria-hidden="true">
      {HERO_SLIDES.map((s, k) => (
        <div key={s.poster} className="hero-slide" data-on={k === i || undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.poster} alt="" fetchPriority={k === 0 ? 'high' : 'low'} />
          {s.video && !broken[k] ? (
            <video ref={(el) => { videos.current[k] = el; }} src={s.video} poster={s.poster} muted loop playsInline preload="metadata" onError={() => setBroken((b) => ({ ...b, [k]: true }))} />
          ) : null}
        </div>
      ))}
      <div className="hero-shade" />
    </div>
  );
}

export default function Hero() {
  const router = useRouter();
  const [intent, setIntent] = useState<Intent>('hire');
  const [query, setQuery] = useState('');
  const [playing, setPlaying] = useState(true);
  const search = (to: Destination) => goSearch(router.push, intent, to);

  return (
    <section className="lhero" aria-labelledby="hero-title">
      <Background playing={playing} />
      <div className="hero-inner">
        <p className="hero-eyebrow">The freelance marketplace</p>
        <h1 id="hero-title">Great work starts with the right people.</h1>
        <p className="hero-lead">Discover exceptional talent, find meaningful projects, and bring your next big idea to life.</p>
        <Segmented
          tone="glass"
          label="I want to"
          value={intent}
          onChange={setIntent}
          options={[{ value: 'hire', label: 'Hire' }, { value: 'work', label: 'Work' }]}
          className="hero-toggle"
        />
        <HeroSearch placeholder={COPY[intent].placeholder} action={COPY[intent].action} query={query} setQuery={setQuery} onSearch={search} />
        <p className="hero-examples">
          <span>Try:</span>
          {EXAMPLES[intent].slice(0, 3).map((x, k) => (
            <button key={x} type="button" onClick={() => { setQuery(x); search({ q: x }); }}>{x}{k < 2 ? ',' : ''}</button>
          ))}
        </p>
        <div className="hero-chips">
          <span>Popular:</span>
          {TRENDING.map((t) => (
            <button key={t} type="button" className="hchip" onClick={() => search({ q: t })}>
              {t}<span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>
      {HERO_SLIDES.length > 1 ? (
        <button type="button" className="hero-pause" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause background' : 'Play background'}>
          {playing ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
          )}
        </button>
      ) : null}
    </section>
  );
}
