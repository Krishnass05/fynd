'use client';
// Pricing, inside the signed-in client app (under AppShell: top bar, search, account menu). OWNER: Krishna.
// Same plans and matrix as the public /pricing page (components/pricing/PricingPlans.tsx, lib/pricing.ts).
// No billing is wired up: choosing a plan here is a demo action only, it does not charge or change the account.
import { useState } from 'react';
import Link from 'next/link';
import { ComparisonMatrix, PlanGrid } from '@/components/pricing/PricingPlans';
import type { Plan } from '@/lib/pricing';
import { Card } from '@/components/ui';
import plansStyle from '@/components/pricing/pricing-plans.module.css';
import s from './pricing.module.css';

export default function ClientPricing() {
  const [chosen, setChosen] = useState<Plan | null>(null);

  return (
    <>
      <h1>Pricing</h1>
      <p className="muted">Every plan prices extra requests before the work starts. Pay more only when you need payment protection and team tools.</p>

      {chosen ? (
        <Card plain>
          <p>
            <strong>You selected {chosen.name}.</strong> This is a hackathon demo: nothing is charged and your account is not changed. A real checkout (Razorpay) is the next step once pricing is validated with agencies.
          </p>
        </Card>
      ) : null}

      <PlanGrid
        renderCta={(p) => (
          <button type="button" className={`btn ${p.popular ? '' : 'secondary'} ${plansStyle.cta}`} onClick={() => setChosen(p)}>
            {chosen?.id === p.id ? 'Selected (demo)' : p.cta}
          </button>
        )}
      />
      <ComparisonMatrix />

      <p className={s.note}>
        Prices in INR, before GST, shown to every client while we test them with small agencies. No payment moves through the site; see the{' '}
        <Link href="/terms">terms</Link>. The same plans are on the public <Link href="/pricing">pricing page</Link>.
      </p>
    </>
  );
}
