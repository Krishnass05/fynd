'use client';
// The task list with the progress bar. OWNER: Krishna. Used on both project pages.
// Freelancer: starts tasks, marks them done, puts them in milestones. Client: approves done tasks or sends them back.
// Tasks come from the signed SOW and from agreed requests; the rules are on the server (lib/engine/progress.js).
import { useState } from 'react';
import { moveWork, setWorkMilestone } from '@/lib/api';
import type { Milestone, ProjectDetail, WorkItem, WorkStatus } from '@/lib/types';
import type { Progress } from '@/lib/engine/progress';
import { Badge, Button, EmptyState, ErrorMessage, ProgressBar, money } from '@/components/ui';
import s from './work.module.css';

type Role = 'client' | 'freelancer';
const STATUS: Record<WorkStatus, { text: string; tone: 'neutral' | 'good' | 'bad' | 'warn' }> = {
  todo: { text: 'To do', tone: 'neutral' },
  in_progress: { text: 'In progress', tone: 'warn' },
  done: { text: 'Done: waiting for approval', tone: 'warn' },
  approved: { text: 'Approved', tone: 'good' },
};
const SOURCE: Record<WorkItem['source'], string> = { sow: 'Signed SOW', request: 'Agreed request', defect: 'Own defect fix', included: 'Already included' };

function Row({ w, role, milestones, projectId, onChanged }: { w: WorkItem; role: Role; milestones: Milestone[]; projectId: string; onChanged: (p: ProjectDetail) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [back, setBack] = useState<string | null>(null);
  const lastBack = [...w.events].reverse().find((e) => e.action === 'sent_back');

  async function go(fn: () => Promise<ProjectDetail>) {
    setBusy(true);
    try { onChanged(await fn()); setError(null); setBack(null); } catch (e) { setError(e instanceof Error ? e.message : 'That did not work'); } finally { setBusy(false); }
  }

  return (
    <li className={s.row}>
      <div className={s.main}>
        <div className={s.title}>{w.title}</div>
        <div className={s.meta}>
          <span>{w.hours === null ? 'hours unknown' : `${w.hours}h`}</span>
          <span>{SOURCE[w.source]}{w.source === 'request' && w.price !== null ? `, ${money(w.price)}` : ''}</span>
          {role === 'freelancer' && w.status !== 'approved' ? (
            <select className={s.select} aria-label={`Milestone for ${w.title}`} value={w.milestoneId ?? ''} disabled={busy}
              onChange={(e) => void go(() => setWorkMilestone(projectId, w.key, e.target.value || null))}>
              <option value="">No milestone</option>
              {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          ) : <span>{milestones.find((m) => m.id === w.milestoneId)?.title ?? 'No milestone'}</span>}
        </div>
        {w.status === 'in_progress' && lastBack ? <p className={s.back}>Sent back by the client: {lastBack.note}</p> : null}
        <ErrorMessage message={error} />
        {back !== null ? (
          <div className={s.backForm}>
            <input value={back} onChange={(e) => setBack(e.target.value)} placeholder="What still needs doing?" aria-label={`What still needs doing on ${w.title}`} />
            <Button variant="danger" disabled={busy} onClick={() => void go(() => moveWork(projectId, w.key, 'in_progress', back))}>Send back</Button>
            <Button variant="secondary" onClick={() => setBack(null)}>Cancel</Button>
          </div>
        ) : null}
      </div>
      <div className={s.side}>
        <Badge tone={STATUS[w.status].tone}>{STATUS[w.status].text}</Badge>
        {role === 'freelancer' && w.status === 'todo' ? <Button variant="secondary" disabled={busy} onClick={() => void go(() => moveWork(projectId, w.key, 'in_progress'))}>Start</Button> : null}
        {role === 'freelancer' && (w.status === 'todo' || w.status === 'in_progress') ? <Button disabled={busy} onClick={() => void go(() => moveWork(projectId, w.key, 'done'))}>Mark done</Button> : null}
        {role === 'client' && w.status === 'done' && back === null ? (
          <>
            <Button disabled={busy} onClick={() => void go(() => moveWork(projectId, w.key, 'approved'))}>Approve</Button>
            <Button variant="secondary" disabled={busy} onClick={() => setBack('')}>Send back</Button>
          </>
        ) : null}
      </div>
    </li>
  );
}

export default function WorkBoard({ projectId, role, work, progress, milestones, onChanged }: {
  projectId: string; role: Role; work: WorkItem[]; progress: Progress; milestones: Milestone[]; onChanged: (p: ProjectDetail) => void;
}) {
  if (!work.length) {
    return <EmptyState>No tasks yet. Tasks appear when the first SOW is signed, and when a new request is agreed.</EmptyState>;
  }
  const order: WorkStatus[] = role === 'client' ? ['done', 'in_progress', 'todo', 'approved'] : ['in_progress', 'todo', 'done', 'approved'];
  const sorted = [...work].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  return (
    <div className={s.board}>
      <div className={s.summary}>
        {progress.percent === null
          ? <p className="muted">No task has hours yet, so there is no progress percentage. Hours come from the signed SOW and agreed requests.</p>
          : <ProgressBar value={progress.percent} label={`Approved ${progress.approvedHours}h of ${progress.totalHours}h`} />}
        <p className="muted">
          {progress.approvedCount} of {progress.totalCount} tasks approved · {progress.doneHours - progress.approvedHours}h done and waiting for approval
          {progress.unknownHoursCount ? ` · ${progress.unknownHoursCount} ${progress.unknownHoursCount === 1 ? 'task has' : 'tasks have'} unknown hours and ${progress.unknownHoursCount === 1 ? 'is' : 'are'} not counted` : ''}
        </p>
      </div>
      <ul className={s.list}>
        {sorted.map((w) => <Row key={w.key} w={w} role={role} milestones={milestones} projectId={projectId} onChanged={onChanged} />)}
      </ul>
    </div>
  );
}
