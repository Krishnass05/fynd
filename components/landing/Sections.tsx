'use client';
// The rest of the home page: How it works (two journeys), sample talent, the final call to action and
// the footer. All people and text are sample content for the demo. OWNER: Krishna.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { initials } from '@/lib/format';
import { HOW, TALENT, type Intent } from './data';
import { freelancerProfilePath, goSearch, goTo } from './goSearch';
import Segmented from './Segmented';

function StepImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="how-img how-img--empty" role="img" aria-label={alt} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="how-img" src={src} alt={alt} loading="lazy" width={800} height={600} onError={() => setFailed(true)} />;
}

export function HowItWorks() {
  const [mode, setMode] = useState<Intent>('hire');
  return (
    <section className="how" id="how-it-works" aria-labelledby="how-title">
      <div className="lwrap">
        <div className="how-head">
          <h2 id="how-title">How it works</h2>
          <Segmented tone="light" label="Show the steps for" value={mode} onChange={setMode} options={[{ value: 'hire', label: 'For Hiring' }, { value: 'work', label: 'For Finding Work' }]} />
        </div>
        <ol className="how-grid" key={mode}>
          {HOW[mode].map((s, i) => (
            <li key={s.title} className="how-card">
              <div className="how-frame"><StepImage src={s.image} alt={s.alt} /></div>
              <p className="how-step">Step {i + 1}</p>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="how-note">Milestones and payments are recorded here; no money moves through the site in this demo.</p>
      </div>
    </section>
  );
}

export function FeaturedTalent() {
  const router = useRouter();
  return (
    <section className="talent" aria-labelledby="talent-title">
      <div className="lwrap">
        <div className="talent-head">
          <div>
            <h2 id="talent-title">Featured talent</h2>
            <p className="lsub">Sample profiles from the demo data. Names, rates and details are made up.</p>
          </div>
          <button type="button" className="btn secondary" onClick={() => goSearch(router.push, 'hire')}>Browse all freelancers</button>
        </div>
        <ul className="talent-grid">
          {TALENT.map((t) => (
            <li key={t.id} className="tcard">
              <span className="tcard-avatar" aria-hidden="true">{initials(t.name)}</span>
              <h3>{t.name}</h3>
              <p className="tcard-role">{t.role}</p>
              <p className="tcard-intro">{t.intro}</p>
              <ul className="tcard-skills" aria-label="Skills">{t.skills.map((s) => <li key={s}>{s}</li>)}</ul>
              <div className="tcard-foot">
                <span><strong>₹{t.rate.toLocaleString('en-IN')}</strong>/hr</span>
                <button type="button" className="btn secondary" onClick={() => goTo(router.push, freelancerProfilePath(t.id))}>View profile</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta() {
  const router = useRouter();
  return (
    <section className="fcta" aria-labelledby="fcta-title">
      <div className="lwrap">
        <h2 id="fcta-title">Your next great collaboration starts here.</h2>
        <p>Every extra request is priced and approved in writing before the work starts.</p>
        <div className="fcta-row">
          <button type="button" className="btn" onClick={() => goSearch(router.push, 'hire')}>Find Talent</button>
          <button type="button" className="btn glass-light" onClick={() => goSearch(router.push, 'work')}>Start Freelancing</button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="lfoot">
      <div className="lwrap lfoot-row">
        <div>
          <p className="lfoot-brand">Craft<span>Hire</span></p>
          <p>The Scope Change Desk demo. All data is synthetic. A workflow aid, not legal advice.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/login">Log in</Link>
          <Link href="/register">Sign up</Link>
          <a href="#how-it-works">How it works</a>
          <Link href="/demo">Case checks</Link>
        </nav>
      </div>
    </footer>
  );
}
