'use client';
// Call credits for the client: balance, buy a pack, and every credit used or bought. OWNER: Krishna.
// Each answered call uses 1 credit; freelancers never pay. Demo: buying adds credits straight away and no
// payment is taken (a real checkout, Razorpay, comes later). Packs and prices: lib/engine/credits.js.
import { useState } from 'react';
import Link from 'next/link';
import { buyCredits, getCredits } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Button, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';
import s from './credits.module.css';

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function Credits() {
  const { data, error, loading, setData } = useAsync(getCredits, []);
  const [busy, setBusy] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [bought, setBought] = useState<string | null>(null);

  async function buy(packId: string, label: string) {
    setBusy(packId);
    try {
      setData(await buyCredits(packId));
      setBuyError(null);
      setBought(`${label} added. This is a demo: no payment was taken.`);
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Could not add the credits');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <h1>Call credits</h1>
      <p className="muted">Each voice or video call uses 1 credit when it is answered (₹20 a credit). A missed or declined call is free. Every client starts with 10 credits; freelancers never pay for calls.</p>
      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}
      {data ? (
        <>
          <section className={s.balance} aria-label="Your balance">
            <p className={s.big}><strong>{data.balance}</strong> {data.balance === 1 ? 'credit' : 'credits'} left</p>
            <p className="muted">{data.balance === 0 ? 'You are out of credits: buy a pack below to call again.' : `Enough for ${data.balance} more ${data.balance === 1 ? 'call' : 'calls'}.`}</p>
          </section>

          <h2>Buy credits</h2>
          {bought ? <p className={s.notice} role="status">{bought}</p> : null}
          <ErrorMessage message={buyError} />
          <ul className={s.packs}>
            {data.packs.map((p) => (
              <li key={p.id} className={s.pack}>
                <p className={s.credits}><strong>{p.credits}</strong> {p.credits === 1 ? 'credit' : 'credits'}</p>
                <p className={s.price}>{money(p.price)} <span className="muted">before GST</span></p>
                <Button disabled={busy !== null} onClick={() => void buy(p.id, p.label)}>{busy === p.id ? 'Adding...' : 'Add'}</Button>
              </li>
            ))}
          </ul>
          <p className="muted">Demo: no payment is taken and nothing is charged; the credits are added straight away. See the <Link href="/terms">terms</Link>.</p>

          <h2>History</h2>
          {data.history.length === 0 ? <EmptyState>No credits used or bought yet.</EmptyState> : (
            <div className={s.scroll} tabIndex={0} role="region" aria-label="Credit history">
              <table className={s.table}>
                <thead><tr><th scope="col">When</th><th scope="col">What</th><th scope="col">Credits</th><th scope="col">Balance</th></tr></thead>
                <tbody>
                  {data.history.map((e) => (
                    <tr key={e.id}>
                      <td>{when(e.at)}</td>
                      <td>{e.reason === 'call' ? <>Call answered{e.projectTitle ? <> · <Link href={`/client/projects/${e.projectId}`}>{e.projectTitle}</Link></> : null}</> : <>Bought a pack{e.price ? ` (${money(e.price)}, demo)` : ''}</>}</td>
                      <td className={e.delta < 0 ? s.minus : s.plus}>{e.delta > 0 ? `+${e.delta}` : e.delta}</td>
                      <td>{e.balanceAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </>
  );
}
