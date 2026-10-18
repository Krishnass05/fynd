'use client';
// New tasks in plain English, and the negotiation on their price. Used on both project pages. OWNER: Krishna.
// Client: asks for something new, answers questions, counters / accepts / declines quotes, withdraws a request.
// Freelancer: answers each request (already included, own defect, quote, ask, decline), then counters / accepts.
// All rules are on the server (lib/server/service.ts, lib/engine/negotiation.js); this only shows and sends.
import { useState } from 'react';
import { actOnTask, askForTask, type TaskAction } from '@/lib/api';
import type { ProjectDetail, TaskRequest, TaskStatus } from '@/lib/types';
import type { Offer } from '@/lib/engine/negotiation';
import { Badge, Button, EmptyState, ErrorMessage, Field, money } from '@/components/ui';
import s from './tasks.module.css';

type Role = 'client' | 'freelancer';

const STATUS_TEXT: Record<TaskStatus, string> = {
  waiting_freelancer: 'Waiting for the freelancer',
  needs_details: 'Details asked',
  negotiating: 'Price being agreed',
  agreed: 'Agreed',
  included: 'Already included',
  defect_fix: 'Own defect: no charge',
  declined: 'Declined',
};
const STATUS_TONE: Record<TaskStatus, 'neutral' | 'good' | 'bad' | 'warn'> = {
  waiting_freelancer: 'warn', needs_details: 'warn', negotiating: 'neutral', agreed: 'good', included: 'good', defect_fix: 'good', declined: 'bad',
};
const LABEL_TEXT = { included: 'Looks included', excluded: 'Excluded in SOW', new: 'New work', defect: 'Looks like a defect', unclear: 'Unclear' } as const;
const who = (p: Role, me: Role) => (p === me ? 'You' : p === 'client' ? 'Client' : 'Freelancer');

function priceText(o: Offer) {
  if (o.price === null) return 'No price yet (hours unknown)';
  if (o.basis === 'fixed') return `${money(o.price)} fixed`;
  return `${money(o.price)} = ${o.hours}h x ${money(o.ratePerHour ?? 0)}${o.rush ? ' x rush' : ''}`;
}

// The small form used for a quote and for a counter offer.
function OfferForm({ rate, rush, cta, onSend, onCancel }: { rate: number; rush: boolean; cta: string; onSend: (o: TaskAction & { offer: unknown }) => void; onCancel: () => void }) {
  const [mode, setMode] = useState<'hours' | 'fixed'>('hours');
  const [hours, setHours] = useState('');
  const [r, setR] = useState(String(rate));
  const [price, setPrice] = useState('');
  const [isRush, setRush] = useState(rush);
  const [due, setDue] = useState('');
  const [note, setNote] = useState('');
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  const h = num(hours);
  const preview = mode === 'fixed'
    ? (num(price) !== null ? money(num(price)!) : '')
    : (h !== null && num(r) ? money(Math.round(h * num(r)! * (isRush ? 1.5 : 1))) : 'No price until hours are given');
  function send() {
    const offer = mode === 'fixed'
      ? { price: num(price), hours: h, due: due || null, note }
      : { hours: h, ratePerHour: num(r), rush: isRush, due: due || null, note };
    onSend({ action: 'counter', offer } as TaskAction & { offer: unknown });
  }
  return (
    <div className={s.form}>
      <div className="row" role="radiogroup" aria-label="How to price">
        <label className={s.radio}><input type="radio" checked={mode === 'hours'} onChange={() => setMode('hours')} /> Hours x rate</label>
        <label className={s.radio}><input type="radio" checked={mode === 'fixed'} onChange={() => setMode('fixed')} /> Fixed price</label>
      </div>
      <div className={s.grid}>
        <Field label={mode === 'fixed' ? 'Hours (optional)' : 'Hours'}><input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 6" /></Field>
        {mode === 'hours'
          ? <Field label="Rate per hour (₹)"><input inputMode="numeric" value={r} onChange={(e) => setR(e.target.value)} /></Field>
          : <Field label="Price (₹, before tax)"><input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 6000" /></Field>}
        <Field label="Due date (optional)"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
      </div>
      {mode === 'hours' ? <label className={s.radio}><input type="checkbox" checked={isRush} onChange={(e) => setRush(e.target.checked)} /> Urgent: add the rush fee (x1.5, an assumption)</label> : null}
      <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What is included, assumptions" /></Field>
      <p className={s.preview}>Price before tax: <strong>{preview}</strong></p>
      <div className="row">
        <Button onClick={send}>{cta}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function TaskCard({ t, me, rate, projectId, onChanged }: { t: TaskRequest; me: Role; rate: number; projectId: string; onChanged: (p: ProjectDetail) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<null | 'quote' | 'counter' | 'ask' | 'decline' | 'defect' | 'details'>(null);
  const [text, setText] = useState('');
  const n = t.negotiation ?? null;
  const answerable = t.status === 'waiting_freelancer' || t.status === 'needs_details';
  const myTurn = n?.waitingFor === me;

  async function go(b: TaskAction) {
    setBusy(true);
    try {
      onChanged(await actOnTask(projectId, t.id, b));
      setError(null); setOpen(null); setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not work');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`card ${s.task}`}>
      <div className={s.head}>
        <strong className={s.title}>{t.text}</strong>
        <Badge tone={STATUS_TONE[t.status]}>{STATUS_TEXT[t.status]}</Badge>
        {t.urgent ? <Badge tone="warn">Urgent</Badge> : null}
      </div>
      {t.details.map((d, i) => <p key={i} className={s.detail}>More details: {d}</p>)}
      <p className={s.suggest}>
        <Badge>{LABEL_TEXT[t.suggestion.label]}</Badge> {t.suggestion.reason} <span className="muted">(suggested by rules, the freelancer decides)</span>
      </p>

      {n ? (
        <div className={s.scroll} tabIndex={0} role="region" aria-label={`Offers for ${t.text}`}>
          <table className={s.offers}>
            <thead><tr><th scope="col">#</th><th scope="col">From</th><th scope="col">Price before tax</th><th scope="col">Due</th><th scope="col">Note</th></tr></thead>
            <tbody>
              {n.offers.map((o) => (
                <tr key={o.n} className={n.agreed && n.agreed.n === o.n ? s.agreedRow : undefined}>
                  <td>{o.n}</td>
                  <td>{who(o.by, me)}</td>
                  <td>{priceText(o)}{o.assumptions.length ? <span className="muted"> ({o.assumptions.join('; ')})</span> : null}</td>
                  <td>{o.due ?? '-'}</td>
                  <td>{o.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {n?.agreed ? <p className={s.agreed}>Agreed: <strong>{money(n.agreed.price!)}</strong> before tax{n.agreed.hours !== null ? ` for ${n.agreed.hours}h` : ''}{n.agreed.due ? `, due ${n.agreed.due}` : ''}. Counted in the project totals.</p> : null}
      {t.status === 'defect_fix' ? <p className={s.agreed}>No charge. {t.bookedHours}h booked against the project hours.</p> : null}
      {t.status === 'declined' ? <p className="muted">Closed: {t.events[t.events.length - 1]?.note}. Nothing was committed.</p> : null}
      {t.status === 'needs_details' ? <p className={s.question}>Question from the freelancer: {[...t.events].reverse().find((e) => e.action === 'asked_for_details')?.note}</p> : null}
      {n && n.status === 'open' ? <p className="muted">{myTurn ? 'Your turn to answer the latest offer.' : `Waiting for the ${n.waitingFor}.`}</p> : null}

      <ErrorMessage message={error} />

      {/* freelancer's first answer */}
      {me === 'freelancer' && answerable && !open ? (
        <div className="row">
          <Button disabled={busy} onClick={() => setOpen('quote')}>Quote a price</Button>
          <Button variant="secondary" disabled={busy} onClick={() => void go({ action: 'included' })}>Already included</Button>
          <Button variant="secondary" disabled={busy} onClick={() => setOpen('defect')}>Our defect: fix free</Button>
          <Button variant="secondary" disabled={busy} onClick={() => setOpen('ask')}>Ask for details</Button>
          <Button variant="danger" disabled={busy} onClick={() => setOpen('decline')}>Decline</Button>
        </div>
      ) : null}
      {/* client's answer to a question, or withdrawing */}
      {me === 'client' && answerable && !open ? (
        <div className="row">
          {t.status === 'needs_details' ? <Button disabled={busy} onClick={() => setOpen('details')}>Add details</Button> : null}
          <Button variant="secondary" disabled={busy} onClick={() => setOpen('decline')}>Withdraw request</Button>
        </div>
      ) : null}
      {/* the negotiation */}
      {n && n.status === 'open' && !open ? (
        <div className="row">
          {myTurn && n.canAccept ? <Button disabled={busy} onClick={() => void go({ action: 'accept' })}>Accept {money(n.latest.price!)}</Button> : null}
          {myTurn ? <Button variant="secondary" disabled={busy} onClick={() => setOpen('counter')}>Counter offer</Button> : null}
          <Button variant="danger" disabled={busy} onClick={() => setOpen('decline')}>Decline</Button>
        </div>
      ) : null}

      {open === 'quote' || open === 'counter' ? (
        <OfferForm rate={rate} rush={open === 'quote' && t.urgent} cta={open === 'quote' ? 'Send quote' : 'Send counter offer'} onCancel={() => setOpen(null)}
          onSend={(b) => void go({ action: open === 'quote' ? 'quote' : 'counter', offer: b.offer } as TaskAction)} />
      ) : null}
      {open === 'defect' ? (
        <div className={s.form}>
          <Field label="Hours the fix takes (booked, not charged)"><input inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. 2" /></Field>
          <div className="row"><Button disabled={busy} onClick={() => void go({ action: 'defect', hours: text.trim() === '' ? NaN : Number(text) })}>Confirm: fix at no charge</Button><Button variant="secondary" onClick={() => setOpen(null)}>Cancel</Button></div>
        </div>
      ) : null}
      {open === 'ask' || open === 'decline' || open === 'details' ? (
        <div className={s.form}>
          <Field label={open === 'ask' ? 'Your question for the client' : open === 'details' ? 'More details' : 'Reason'}>
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div className="row">
            <Button variant={open === 'decline' ? 'danger' : 'primary'} disabled={busy}
              onClick={() => void go(open === 'details' ? { action: 'details', text } : { action: open, note: text })}>
              {open === 'ask' ? 'Send question' : open === 'details' ? 'Send details' : me === 'client' && answerable ? 'Withdraw' : 'Decline'}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(null)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      <details className={s.history}>
        <summary>History ({t.events.length})</summary>
        <ul>
          {[...t.events.map((e) => ({ at: e.at, text: `${who(e.by, me)}: ${e.action.replace(/_/g, ' ')}${e.note ? ` - ${e.note}` : ''}` }))]
            .sort((a, b) => a.at.localeCompare(b.at))
            .map((e, i) => <li key={i}><span className="muted">{new Date(e.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span> {e.text}</li>)}
        </ul>
      </details>
    </article>
  );
}

export default function TaskRequests({ projectId, role, tasks, ratePerHour, onChanged }: {
  projectId: string; role: Role; tasks: TaskRequest[]; ratePerHour: number; onChanged: (p: ProjectDetail) => void;
}) {
  const [text, setText] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    setBusy(true);
    try {
      const r = await askForTask(projectId, { text, urgent });
      onChanged(r.project);
      setError(null);
      setInfo(r.created ? 'Sent to the freelancer.' : 'You already asked for this. Showing the existing request; nothing was added twice.');
      if (r.created) { setText(''); setUrgent(false); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send');
      setInfo(null);
    } finally {
      setBusy(false);
    }
  }

  const active = tasks.filter((t) => t.status !== 'declined');
  const closed = tasks.filter((t) => t.status === 'declined');
  return (
    <section aria-label="New tasks">
      {role === 'client' ? (
        <div className={`card ${s.ask}`}>
          <Field label="Ask for something new, in plain English">
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: Can you also add a blog page with 3 posts?" maxLength={1000} />
          </Field>
          <div className="row">
            <label className={s.radio}><input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> Urgent</label>
            <Button disabled={busy || text.trim().length < 5} onClick={() => void ask()}>Send to the freelancer</Button>
          </div>
          <p className="muted">Crewmate checks it against the signed SOW and suggests whether it is included or extra. The freelancer answers, and nothing is charged until you both agree a price.</p>
          <ErrorMessage message={error} />
          {info ? <p className={s.info} role="status">{info}</p> : null}
        </div>
      ) : null}
      {tasks.length === 0 ? <EmptyState>{role === 'client' ? 'No new tasks asked for yet.' : 'The client has not asked for anything new yet.'}</EmptyState> : null}
      {active.map((t) => <TaskCard key={t.id} t={t} me={role} rate={ratePerHour} projectId={projectId} onChanged={onChanged} />)}
      {closed.length ? (
        <details className={s.closed}>
          <summary>Declined or withdrawn ({closed.length})</summary>
          {closed.map((t) => <TaskCard key={t.id} t={t} me={role} rate={ratePerHour} projectId={projectId} onChanged={onChanged} />)}
        </details>
      ) : null}
    </section>
  );
}
