'use client';
// The credits wallet in the client's top bar, left of "Hello, name". OWNER: Krishna.
// Shows the call-credit balance on the button; clicking opens a small panel with the balance and the packs
// (₹20 a credit) to add more, plus a link to the full history. Demo: no payment is taken.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { buyCredits, getCredits } from '@/lib/api';
import type { CreditsInfo } from '@/lib/types';
import { money } from '@/components/ui';
import s from './wallet.module.css';

const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3" />
    <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
    <path d="M21 12h-4a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

export default function CreditWallet() {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<CreditsInfo | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => { void getCredits().then(setInfo).catch(() => undefined); };
  useEffect(load, []);
  useEffect(() => { if (open) { load(); setMsg(null); setErr(null); } }, [open]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  async function add(id: string, label: string) {
    setBusy(id);
    try { setInfo(await buyCredits(id)); setErr(null); setMsg(`${label} added (demo: no payment taken).`); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Could not add credits'); }
    finally { setBusy(null); }
  }

  const balance = info?.balance;
  return (
    <div className={s.wrap} ref={ref}>
      <button type="button" className={s.button} aria-haspopup="dialog" aria-expanded={open} aria-controls="credit-wallet"
        aria-label={balance === undefined ? 'Call credits' : `Call credits: ${balance} left`} onClick={() => setOpen((o) => !o)}>
        <WalletIcon />
        {balance !== undefined ? <span className={`${s.count} ${balance === 0 ? s.empty : ''}`}>{balance}</span> : null}
      </button>
      {open ? (
        <div className={s.panel} id="credit-wallet" role="dialog" aria-label="Call credits">
          <p className={s.title}>Call credits</p>
          <p className={s.balance}><strong>{balance ?? '…'}</strong> {balance === 1 ? 'credit' : 'credits'} left</p>
          <p className={s.note}>1 credit per answered voice or video call.</p>
          <p className={s.sub}>Add credits</p>
          <ul className={s.packs}>
            {(info?.packs ?? []).map((p) => (
              <li key={p.id}>
                <span><strong>{p.label}</strong> · {money(p.price)}</span>
                <button type="button" className="btn" disabled={busy !== null} onClick={() => void add(p.id, p.label)}>{busy === p.id ? '…' : 'Add'}</button>
              </li>
            ))}
          </ul>
          {msg ? <p className={s.ok} role="status">{msg}</p> : null}
          {err ? <p className={s.err} role="alert">{err}</p> : null}
          <p className={s.note}>Prices before GST. Demo: no payment is taken.</p>
          <Link href="/client/credits" className={s.more} onClick={() => setOpen(false)}>See history and details →</Link>
        </div>
      ) : null}
    </div>
  );
}
