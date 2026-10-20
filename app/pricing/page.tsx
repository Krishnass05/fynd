// Public pricing page: three plans and a feature matrix. OWNER: Krishna.
// The plan cards and matrix are shared with the signed-in client's pricing page
// (app/(client)/client/pricing) via components/pricing/PricingPlans.tsx and lib/pricing.ts.
// Prices are proposals (assumptions), not observed demand. Features not built yet say "Coming soon".
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { ComparisonMatrix, PlanGrid } from '@/components/pricing/PricingPlans';
import s from './pricing.module.css';
import plansStyle from '@/components/pricing/pricing-plans.module.css';

export const metadata = { title: 'Pricing · Crewmate' };

export default function Pricing() {
  return (
    <main id="main-content" className={s.page}>
      <header className={s.top}>
        <Link href="/" className={s.brand}><LogoMark size={28} /> Crewmate</Link>
        <nav className={s.nav}><Link href="/login">Log in</Link><Link href="/register" className="btn">Sign up</Link></nav>
      </header>

      <section className={s.hero}>
        <p className={s.eyebrow}>Pricing</p>
        <h1>Stop scope creep before it costs you</h1>
        <p className={s.sub}>Every plan prices extra requests before the work starts. Pay more only when you need payment protection and team tools.</p>
        <p className={s.token}>1 negotiation token = 1 AI-assisted negotiation (a call or a priced change request). Unused tokens do not roll over.</p>
      </section>

      <PlanGrid renderCta={(p) => <Link href="/register" className={`btn ${p.popular ? '' : 'secondary'} ${plansStyle.cta}`}>{p.cta}</Link>} />
      <ComparisonMatrix />

      <p className={s.note}>Prices in INR, before GST. Hackathon demo: prices are proposals being tested with small agencies, not observed demand; no payment is taken. Features marked “Coming soon” are planned, not built.</p>
    </main>
  );
}
