'use client';
// Daily check-ins. OWNER: Krishna. Used on both project pages.
// Freelancer: posts today's check-in (what was done, hours, blockers) and can start or finish tasks in the same step.
// Client: reads them, and sees a warning after 2 days without one. One check-in a day, India time (server rule).
import { useState } from 'react';
import { addCheckin } from '@/lib/api';
import type { CheckIn, ProjectDetail, WorkItem, WorkStatus } from '@/lib/types';
import type { CheckinStatus } from '@/lib/engine/progress';
import { Button, EmptyState, ErrorMessage, Field } from '@/components/ui';
import s from './work.module.css';

type Role = 'client' | 'freelancer';
const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const TO_TEXT: Record<WorkStatus, string> = { todo: 'to do', in_progress: 'started', done: 'done', approved: 'approved' };

export default function CheckIns({ projectId, role, checkins, status, work, freelancerName, onChanged }: {
  projectId: string; role: Role; checkins: CheckIn[]; status: CheckinStatus; work: WorkItem[]; freelancerName: string; onChanged: (p: ProjectDetail) => void;
}) {
  const [did, setDid] = useState('');
  const [hours, setHours] = useState('');
  const [blockers, setBlockers] = useState('');
  const [moves, setMoves] = useState<Record<string, WorkStatus | ''>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const open = work.filter((w) => w.status === 'todo' || w.status === 'in_progress');

  async function send() {
    setBusy(true);
    try {
      const moved = Object.entries(moves).filter(([, to]) => to).map(([key, to]) => ({ key, to: to as WorkStatus }));
      onChanged(await addCheckin(projectId, { did, hours: hours.trim() === '' ? NaN : Number(hours), blockers, moved }));
      setDid(''); setHours(''); setBlockers(''); setMoves({}); setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post the check-in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.checkins}>
      {status.warn ? (
        <p className={s.warn} role="status">
          {role === 'client' ? `No check-in from ${freelancerName}` : 'No check-in'} for {status.daysSince} days{status.last ? ` (last on ${fmtDay(status.last)})` : ''}.
          {role === 'freelancer' ? ' The client can see this.' : ''}
        </p>
      ) : null}

      {role === 'freelancer' && !status.checkedInToday ? (
        <div className={s.form}>
          <strong>Today&apos;s check-in</strong>
          <Field label="What did you do today?"><textarea rows={2} value={did} onChange={(e) => setDid(e.target.value)} placeholder="For example: built the menu page layout and wired the contact form" /></Field>
          <div className={s.grid}>
            <Field label="Hours spent today"><input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 3" /></Field>
            <Field label="Blockers (optional)"><input value={blockers} onChange={(e) => setBlockers(e.target.value)} placeholder="Waiting for the menu prices" /></Field>
          </div>
          {open.length ? (
            <fieldset className={s.moves}>
              <legend>Move tasks (optional)</legend>
              {open.map((w) => (
                <label key={w.key} className={s.move}>
                  <span>{w.title}</span>
                  <select value={moves[w.key] ?? ''} onChange={(e) => setMoves({ ...moves, [w.key]: e.target.value as WorkStatus | '' })} aria-label={`Move ${w.title}`}>
                    <option value="">No change</option>
                    {w.status === 'todo' ? <option value="in_progress">Started</option> : null}
                    <option value="done">Done</option>
                  </select>
                </label>
              ))}
            </fieldset>
          ) : null}
          <ErrorMessage message={error} />
          <div className="row"><Button disabled={busy || did.trim().length < 3} onClick={() => void send()}>Post check-in</Button></div>
        </div>
      ) : null}
      {role === 'freelancer' && status.checkedInToday ? <p className="muted">You checked in today. The next one opens tomorrow (India time).</p> : null}

      {checkins.length === 0 ? <EmptyState>{role === 'client' ? `No check-ins from ${freelancerName} yet.` : 'No check-ins yet.'}</EmptyState> : (
        <ul className={s.log}>
          {checkins.map((c) => (
            <li key={c.id}>
              <div className={s.logHead}><strong>{fmtDay(c.day)}</strong><span className="muted">{c.hours}h</span></div>
              <p>{c.did}</p>
              {c.blockers ? <p className={s.blocker}>Blocker: {c.blockers}</p> : null}
              {c.moved.length ? <p className="muted">{c.moved.map((m) => `${m.title}: ${TO_TEXT[m.to]}`).join(' · ')}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
