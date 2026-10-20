'use client';
// Pricing, shown on the home page as the visitor scrolls. Three plan cards from lib/pricing.ts (shared
// with the full /pricing page, which this section links to for the complete feature matrix). OWNER: Krishna.
import Link from 'next/link';
import { PLANS } from '@/lib/pricing';

export default function PricingSection() {
  return (
    <section className="pricing" id="pricing" aria-labelledby="pricing-title">
      <div className="lwrap">
        <div className="pricing-head">
          <h2 id="pricing-title">Pricing</h2>
          <p className="lsub">Every plan prices extra requests before the work starts. Pay more only when you need payment protection and team tools.</p>
        </div>
        <ul className="pricing-grid">
          {PLANS.map((p) => (
            <li key={p.id} className={`pcard2${p.popular ? ' pcard2--popular' : ''}`}>
              {p.popular ? <span className="pcard2-ribbon">Most popular</span> : null}
              <h3>{p.name}</h3>
              <p className="pcard2-tagline">{p.tagline}</p>
              <p className="pcard2-price"><span>{p.price}</span>{p.per ? <small>{p.per}</small> : null}</p>
              <p className="pcard2-tokens">{p.tokens} negotiation tokens {p.per ? '/ seat / month' : '/ month'}</p>
              <ul className="pcard2-features">
                {p.features.slice(0, 3).map((f) => <li key={f.title}>{f.title}</li>)}
              </ul>
              <Link href="/register" className={`btn pcard2-cta${p.popular ? '' : ' secondary'}`}>{p.cta}</Link>
            </li>
          ))}
        </ul>
        <p className="pricing-note">
          <Link href="/pricing">See the full feature comparison →</Link>
          {' · '}Prices in INR, before GST. Proposals being tested with small agencies, not observed demand.
        </p>
      </div>
    </section>
  );
}
