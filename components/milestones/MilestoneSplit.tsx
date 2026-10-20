'use client';
// Split the agreed price into milestones before accepting an applicant. OWNER: Krishna.
// Props: price (whole rupees), onConfirm(parts), onCancel(), busy. The parts must add up to the price exactly.
import { useState } from 'react';
import { MAX_MILESTONES, checkSplit, defaultSplit } from '@/lib/milestones';
import { Button, ErrorMessage, money } from '@/components/ui';

interface Row {
  title: string;
  amount: string;
}

export default function MilestoneSplit({ price, who, onConfirm, onCancel, busy }: {
  price: number;
  who: string;
  onConfirm: (parts: Array<{ title: string; amount: number }>) => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(() => defaultSplit(price).map((p) => ({ title: p.title, amount: String(p.amount) })));
  const [error, setError] = useState<string | null>(null);

  const parts = rows.map((r) => ({ title: r.title.trim(), amount: Number(r.amount) }));
  const sum = parts.reduce((n, p) => n + (Number.isFinite(p.amount) ? p.amount : 0), 0);
  const diff = price - sum;

  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, n) => (n === i ? { ...r, ...patch } : r)));

  function confirm() {
    const problem = checkSplit(parts, price);
    if (problem) return setError(problem);
    setError(null);
    onConfirm(parts);
  }

  return (
    <section className="card" aria-label={`Split the price for ${who}`}>
      <h2 style={{ marginTop: 0 }}>Split {money(price)} into milestones</h2>
      <p className="muted">
        You are accepting {who}. Milestones are a record: approving one marks it done, and no money moves. Amounts are before tax and must add up to the agreed price.
      </p>
      <ErrorMessage message={error} />
      {rows.map((r, i) => (
        <div key={i} className="row" style={{ marginBottom: 8, alignItems: 'flex-end' }}>
          <label className="field" style={{ flex: '2 1 160px', margin: 0 }}>
            Milestone {i + 1}
            <input value={r.title} onChange={(e) => set(i, { title: e.target.value })} maxLength={80} />
          </label>
          <label className="field" style={{ flex: '1 1 110px', margin: 0 }}>
            Amount (rupees)
            <input value={r.amount} onChange={(e) => set(i, { amount: e.target.value })} type="number" min={1} step={1} inputMode="numeric" />
          </label>
          {rows.length > 1 ? <Button type="button" variant="secondary" onClick={() => setRows(rows.filter((_, n) => n !== i))} aria-label={`Remove milestone ${i + 1}`}>Remove</Button> : null}
        </div>
      ))}
      <p role="status" className={diff === 0 ? 'muted' : undefined} style={diff === 0 ? undefined : { color: 'var(--bad)' }}>
        Total {money(sum)} of {money(price)}{diff === 0 ? ': ready' : diff > 0 ? `: ${money(diff)} still to assign` : `: ${money(-diff)} too much`}
      </p>
      <div className="row">
        {rows.length < MAX_MILESTONES ? <Button type="button" variant="secondary" onClick={() => setRows([...rows, { title: '', amount: '' }])}>Add milestone</Button> : null}
        <Button type="button" onClick={confirm} disabled={busy}>{busy ? 'Accepting...' : 'Accept and create project'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </section>
  );
}
