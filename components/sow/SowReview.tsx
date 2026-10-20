'use client';
// The first SOW as a table, and its sign-off. OWNER: Krishna. Used on both project pages.
// Client: uploads it (or a new version), and confirms or sends back the freelancer's hours.
// Freelancer: fills in or changes the hours per row and approves, or sends it back with a reason.
// The rules are on the server (reviewSow in lib/server/service.ts); this only shows and sends.
import { useState } from 'react';
import { reviewSow } from '@/lib/api';
import type { ProjectDetail, SowDocument, SowStatus } from '@/lib/types';
import { Badge, Button, ErrorMessage, Field, money } from '@/components/ui';
import SowUpload from './SowUpload';
import s from './sow.module.css';

type Role = 'client' | 'freelancer';
const statusOf = (d: SowDocument): SowStatus => d.status ?? 'signed';
const STATUS: Record<SowStatus, { text: string; tone: 'neutral' | 'good' | 'bad' | 'warn' }> = {
  proposed: { text: 'Waiting for the freelancer', tone: 'warn' },
  awaiting_client: { text: 'Waiting for the client to confirm hours', tone: 'warn' },
  signed: { text: 'Signed by both sides', tone: 'good' },
  sent_back: { text: 'Sent back', tone: 'bad' },
  replaced: { text: 'Replaced', tone: 'neutral' },
};
// A short version of public/sample-sow.txt, shown in the upload guide
const SAMPLE = `Statement of Work: Website for Sunrise Bakery
Rate: Rs 1000/hr

Deliverables
- Home page with the bakery story (6 hours)
- Menu page with prices for 20 items (4 hours)
- Contact form that emails the owner (3 hours)
- Two rounds of changes after the first draft

Excluded
- Online ordering and payment checkout
- Logo design`;
const fmtDate = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function SowReview({ projectId, role, docs, ratePerHour, onChanged, onUploaded }: {
  projectId: string; role: Role; docs: SowDocument[]; ratePerHour: number; onChanged: (p: ProjectDetail) => void; onUploaded: () => void;
}) {
  const baselines = docs.filter((d) => d.kind === 'baseline');
  const current = [...baselines].reverse().find((d) => statusOf(d) !== 'replaced') ?? null;
  const st = current ? statusOf(current) : null;
  const [hours, setHours] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState('');
  const [open, setOpen] = useState<null | 'send_back'>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const editing = role === 'freelancer' && st === 'proposed' && current;
  const rowHours = (d: SowDocument) => hours[d.id] ?? d.items.map((i, n) => {
    const h = d.review && statusOf(d) === 'proposed' ? d.review.rows[n]?.hours : i.hours;
    return h === null || h === undefined ? '' : String(h);
  });

  async function go(b: Parameters<typeof reviewSow>[2]) {
    if (!current) return;
    setBusy(true);
    try {
      onChanged(await reviewSow(projectId, current.id, b));
      setError(null); setOpen(null); setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not work');
    } finally {
      setBusy(false);
    }
  }

  function approve() {
    if (!current) return;
    const raw = rowHours(current);
    const rows = raw.map((v) => ({ hours: v.trim() === '' ? null : Number(v) }));
    void go({ action: 'approve', rows, note: note || undefined });
  }

  // ---- nothing yet, or the last one was sent back ----
  const lastNote = current?.history?.[current.history.length - 1];
  const needsUpload = !current || st === 'sent_back';

  return (
    <div className={s.review}>
      {current ? (
        <>
          <div className={s.head}>
            <strong>v{current.version}: {current.filename}</strong>
            <Badge tone={STATUS[st!].tone}>{STATUS[st!].text}</Badge>
          </div>
          {st === 'sent_back' && lastNote ? <p className={s.callout}>The freelancer sent it back: {lastNote.note}</p> : null}
          {st === 'proposed' && lastNote?.action === 'hours_sent_back' ? <p className={s.callout}>The client sent the hours back: {lastNote.note}</p> : null}
          <SowTable doc={current} rate={current.ratePerHour ?? ratePerHour} editable={!!editing} values={rowHours(current)}
            onEdit={(n, v) => { const next = [...rowHours(current)]; next[n] = v; setHours({ ...hours, [current.id]: next }); }} />
          {current.ratePerHour && st !== 'signed' ? <p className="muted">Prices use the rate in this SOW ({money(current.ratePerHour)}/hr); it becomes the project rate when signed.</p> : null}
          {st === 'signed' && current.signedAt ? <p className="muted">Signed {fmtDate(current.signedAt)}. Requests and amendments are checked against this version.</p> : null}
          {st === 'signed' && !current.signedAt ? <p className="muted">Signed. Requests and amendments are checked against this version.</p> : null}
        </>
      ) : null}

      <ErrorMessage message={error} />

      {/* freelancer review */}
      {editing && !open ? (
        <div className={s.actions}>
          <p className="muted">Fill in or change the hours for each included row (leave empty if unknown), then approve. If you change any hours, the client confirms them before the SOW is signed.</p>
          <Field label="Note to the client (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div className="row">
            <Button disabled={busy} onClick={approve}>Approve SOW</Button>
            <Button variant="danger" disabled={busy} onClick={() => setOpen('send_back')}>Send back</Button>
          </div>
        </div>
      ) : null}
      {role === 'freelancer' && st === 'awaiting_client' ? <p className="muted">You approved it with hours. Waiting for the client to confirm them.</p> : null}
      {role === 'freelancer' && needsUpload ? <p className="muted">{current ? 'Waiting for the client to upload a new version.' : 'Waiting for the client to upload the SOW. You will review it here.'}</p> : null}

      {/* client confirmation of the freelancer's hours */}
      {role === 'client' && st === 'awaiting_client' && !open ? (
        <div className={s.actions}>
          <p>{current?.review?.by} filled in or changed the hours (shown above). Confirm them to sign the SOW, or send them back.</p>
          <div className="row">
            <Button disabled={busy} onClick={() => void go({ action: 'confirm' })}>Confirm hours and sign</Button>
            <Button variant="danger" disabled={busy} onClick={() => setOpen('send_back')}>Send the hours back</Button>
          </div>
        </div>
      ) : null}
      {role === 'client' && st === 'proposed' ? <p className="muted">Waiting for the freelancer to review it. You can still upload a corrected version below.</p> : null}

      {open === 'send_back' ? (
        <div className={s.actions}>
          <Field label={role === 'freelancer' ? 'What needs to change?' : 'What is wrong with the hours?'}>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="row">
            <Button variant="danger" disabled={busy} onClick={() => void go({ action: 'send_back', note })}>Send back</Button>
            <Button variant="secondary" onClick={() => setOpen(null)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {role === 'client' && (needsUpload || st === 'proposed') ? (
        <div className={s.upload}>
          <SowUpload projectId={projectId} kind="baseline" onDone={() => onUploaded()} />
          <details className={s.guide}>
            <summary>How to format your SOW (with a sample)</summary>
            <ul>
              <li>Put each piece of work on its own line starting with <code>- </code>, under a heading <strong>Deliverables</strong> (or Included).</li>
              <li>Things that are not part of the price go under <strong>Excluded</strong>. Asking for them later is a paid change.</li>
              <li>Add hours in brackets if you know them, like <code>(6 hours)</code>. If not, leave them out: the freelancer fills them in and you confirm.</li>
              <li>A line like <code>Rate: Rs 1000/hr</code> sets the hourly rate. Save as .txt or .md.</li>
            </ul>
            <pre className={s.sample}>{SAMPLE}</pre>
            <a className="btn secondary" href="/sample-sow.txt" download="sample-sow.txt">Download the sample SOW</a>
          </details>
        </div>
      ) : null}

      {current?.history?.length ? (
        <details className={s.history}>
          <summary>History ({current.history.length})</summary>
          <ul>{current.history.map((h, i) => <li key={i}><span className="muted">{fmtDate(h.at)}</span> {h.by === 'client' ? 'Client' : 'Freelancer'}: {h.action.replace(/_/g, ' ')}{h.note ? ` - ${h.note}` : ''}</li>)}</ul>
        </details>
      ) : null}
      {docs.length > 1 ? <p className="muted">All versions: {docs.map((d) => `v${d.version} ${d.kind}${d.kind === 'baseline' ? ` (${STATUS[statusOf(d)].text.toLowerCase()})` : ''}`).join(' · ')}</p> : null}
    </div>
  );
}

function SowTable({ doc, rate, editable, values, onEdit }: { doc: SowDocument; rate: number; editable: boolean; values: string[]; onEdit: (n: number, v: string) => void }) {
  const showReview = statusOf(doc) === 'awaiting_client' && doc.review;
  const hoursFor = (n: number): number | null => {
    if (editable) { const v = values[n]; return v.trim() === '' || Number.isNaN(Number(v)) ? null : Number(v); }
    if (showReview) return doc.review!.rows[n].hours;
    return doc.items[n].hours;
  };
  const included = doc.items.map((it, n) => ({ it, n })).filter(({ it }) => it.section !== 'excluded');
  const total = included.reduce((acc, { n }) => { const h = hoursFor(n); return h === null ? { ...acc, unknown: acc.unknown + 1 } : { ...acc, hours: acc.hours + h }; }, { hours: 0, unknown: 0 });
  return (
    <div className={s.scroll} tabIndex={0} role="region" aria-label="SOW items">
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col">#</th><th scope="col">Item</th><th scope="col">In scope?</th>
            {showReview ? <th scope="col">Hours in SOW</th> : null}
            <th scope="col">{showReview ? "Freelancer's hours" : 'Hours'}</th>
            <th scope="col">Price before tax</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((it, n) => {
            const excluded = it.section === 'excluded';
            const h = hoursFor(n);
            return (
              <tr key={n} className={excluded ? s.excluded : undefined}>
                <td>{n + 1}</td>
                <td>{it.text}</td>
                <td>{excluded ? <Badge tone="bad">Excluded</Badge> : <Badge tone="good">Included</Badge>}</td>
                {showReview ? <td>{it.hours === null ? 'unknown' : `${it.hours}h`}</td> : null}
                <td>
                  {excluded ? '-' : editable
                    ? <input className={s.hours} inputMode="decimal" aria-label={`Hours for ${it.text}`} value={values[n]} placeholder="unknown" onChange={(e) => onEdit(n, e.target.value)} />
                    : h === null ? 'unknown' : `${h}h`}
                  {showReview && !excluded && doc.review!.rows[n].hours !== it.hours ? <> <Badge tone="warn">changed</Badge></> : null}
                </td>
                <td>{excluded ? 'Not included' : h === null ? 'No price yet' : money(Math.round(h * rate))}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={showReview ? 4 : 3}><strong>Included total</strong></td>
            <td><strong>{total.hours}h</strong>{total.unknown ? <span className="muted"> + {total.unknown} unknown</span> : null}</td>
            <td><strong>{money(Math.round(total.hours * rate))}</strong>{total.unknown ? <span className="muted"> so far</span> : null}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
