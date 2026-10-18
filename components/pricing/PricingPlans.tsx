// The plan cards and the feature comparison matrix: the part shared between the public /pricing page
// and the pricing page inside the signed-in client app (app/(client)/client/pricing). Data in lib/pricing.ts.
// `renderCta` lets each caller decide what the button does (sign up, vs. a demo "select a plan" action).
// OWNER: Krishna.
import type { ReactNode } from 'react';
import { MATRIX, PLANS, type Plan } from '@/lib/pricing';
import s from './pricing-plans.module.css';

const cell = (v: boolean | string) =>
  v === true ? <span className={s.yes} aria-label="Included">✔</span> : v === false ? <span className={s.no} aria-label="Not included">—</span> : <strong>{v}</strong>;

export function PlanGrid({ renderCta }: { renderCta: (plan: Plan) => ReactNode }) {
  return (
    <section className={s.plans} aria-label="Plans">
      {PLANS.map((p) => (
        <article key={p.id} className={`${s.plan} ${p.popular ? s.popular : ''}`}>
          {p.popular ? <span className={s.ribbon}>Most popular</span> : null}
          <h2>{p.name}</h2>
          <p className={s.tagline}>{p.tagline}</p>
          <p className={s.price}><span>{p.price}</span>{p.per ? <small>{p.per}</small> : null}</p>
          <p className={s.tokens}>Includes <strong>{p.tokens} negotiation tokens</strong> {p.per ? 'per seat, per month' : 'a month'}</p>
          {renderCta(p)}
          {p.lead ? <p className={s.lead}>{p.lead}</p> : null}
          <ul className={s.features}>
            {p.features.map((f) => (
              <li key={f.title}><span className={s.check} aria-hidden="true">✔</span><div><strong>{f.title}</strong>{f.soon ? <span className={s.soon}>Coming soon</span> : null}<p>{f.detail}</p></div></li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

export function ComparisonMatrix() {
  return (
    <section className={s.matrixWrap} aria-label="Compare plans">
      <h2>Compare plans</h2>
      <div className={s.scroll} tabIndex={0} role="region" aria-label="Feature comparison">
        <table className={s.matrix}>
          <thead><tr><th scope="col">Key features</th><th scope="col">Basic<br /><small>Free</small></th><th scope="col" className={s.hl}>Business Plus<br /><small>₹399/seat/mo</small></th><th scope="col">Agency Pro<br /><small>₹699/seat/mo</small></th></tr></thead>
          {MATRIX.map((g) => (
            <tbody key={g.group}>
              <tr className={s.group}><th scope="rowgroup" colSpan={4}>{g.group}</th></tr>
              {g.rows.map(([f, a, b, c]) => <tr key={f}><th scope="row">{f}</th><td>{cell(a)}</td><td className={s.hl}>{cell(b)}</td><td>{cell(c)}</td></tr>)}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
