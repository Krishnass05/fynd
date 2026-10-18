// Pricing page: three plans (Basic free, Business Plus ₹399, Agency Pro ₹699) and a feature matrix. OWNER: Krishna.
// Data lives in lib/pricing.ts, shared with the pricing section on the home page. Prices are proposals
// (assumptions), not observed demand. Features not built yet say "Coming soon".
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { MATRIX, PLANS } from '@/lib/pricing';
import s from './pricing.module.css';

export const metadata = { title: 'Pricing · Crewmate' };

const cell = (v: boolean | string) => (v === true ? <span className={s.yes} aria-label="Included">✔</span> : v === false ? <span className={s.no} aria-label="Not included">—</span> : <strong>{v}</strong>);

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

      <section className={s.plans} aria-label="Plans">
        {PLANS.map((p) => (
          <article key={p.id} className={`${s.plan} ${p.popular ? s.popular : ''}`}>
            {p.popular ? <span className={s.ribbon}>Most popular</span> : null}
            <h2>{p.name}</h2>
            <p className={s.tagline}>{p.tagline}</p>
            <p className={s.price}><span>{p.price}</span>{p.per ? <small>{p.per}</small> : null}</p>
            <p className={s.tokens}>Includes <strong>{p.tokens} negotiation tokens</strong> a month</p>
            <Link href="/register" className={`btn ${p.popular ? '' : 'secondary'} ${s.cta}`}>{p.cta}</Link>
            {p.lead ? <p className={s.lead}>{p.lead}</p> : null}
            <ul className={s.features}>
              {p.features.map((f) => (
                <li key={f.title}><span className={s.check} aria-hidden="true">✔</span><div><strong>{f.title}</strong>{f.soon ? <span className={s.soon}>Coming soon</span> : null}<p>{f.detail}</p></div></li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className={s.matrixWrap} aria-label="Compare plans">
        <h2>Compare plans</h2>
        <div className={s.scroll} tabIndex={0} role="region" aria-label="Feature comparison">
          <table className={s.matrix}>
            <thead><tr><th scope="col">Key features</th><th scope="col">Basic<br /><small>Free</small></th><th scope="col" className={s.hl}>Business Plus<br /><small>₹399/mo</small></th><th scope="col">Agency Pro<br /><small>₹699/mo</small></th></tr></thead>
            {MATRIX.map((g) => (
              <tbody key={g.group}>
                <tr className={s.group}><th scope="rowgroup" colSpan={4}>{g.group}</th></tr>
                {g.rows.map(([f, a, b, c]) => <tr key={f}><th scope="row">{f}</th><td>{cell(a)}</td><td className={s.hl}>{cell(b)}</td><td>{cell(c)}</td></tr>)}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <p className={s.note}>Prices in INR, before GST. Hackathon demo: prices are proposals being tested with small agencies, not observed demand; no payment is taken. Features marked “Coming soon” are planned, not built.</p>
    </main>
  );
}
