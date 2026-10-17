'use client';
// Priced change requests with flags and approve / reject / reopen. OWNER: Harini.
// Props: projectId, changes, canDecide (client only), onChanged(project). Used on both sides.
import { useState } from 'react';
import { approveChange, rejectChange, reopenChange } from '@/lib/api';
import type { ChangeRequest, ProjectDetail } from '@/lib/types';
import { Badge, Button, EmptyState, ErrorMessage, money } from '@/components/ui';

const TONE: Record<string, 'neutral' | 'good' | 'bad' | 'warn'> = {
  approved: 'good', rejected: 'bad', needs_clarification: 'warn', quoted: 'neutral', defect_rework: 'neutral', in_scope: 'neutral',
};

export default function ChangeList({ projectId, changes, canDecide, onChanged }: {
  projectId: string; changes: ChangeRequest[]; canDecide: boolean; onChanged: (p: ProjectDetail) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  async function act(fn: () => Promise<ProjectDetail>) {
    try {
      onChanged(await fn());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  }

  if (!changes.length) return <EmptyState>No change requests yet.</EmptyState>;
  return (
    <div>
      <ErrorMessage message={error} />
      {changes.map((c) => (
        <article key={c.id} className="card">
          <div className="row">
            <strong>{c.id}: {c.text}</strong>
            <Badge tone={TONE[c.state] ?? 'neutral'}>{c.state.replace('_', ' ')}</Badge>
            {c.label ? <Badge tone="warn">{c.label.replace('_', ' ')}</Badge> : null}
          </div>
          <p className="muted">{c.hours === null ? 'Hours unknown' : `${c.hours}h`}{c.decidedBy ? ` · decided by ${c.decidedBy}` : ''}{c.decisionReason ? ` (${c.decisionReason})` : ''}</p>
          {c.estimate ? (
            <p>
              <strong>{money(c.estimate.amount)}</strong> before tax = {c.estimate.hours}h x {money(c.estimate.ratePerHour)}{c.estimate.multiplier !== 1 ? ` x ${c.estimate.multiplier} rush` : ''}
              <span className="muted"> ({c.estimate.assumptions.join('; ')})</span>
            </p>
          ) : null}
          {c.flags.map((f) => <div key={f.code} className="muted">Flag: {f.message}</div>)}
          {canDecide && c.state === 'quoted' ? (
            <div className="row">
              <Button onClick={() => act(() => approveChange(projectId, c.id))}>Approve</Button>
              <input placeholder="Reason (optional)" value={reasons[c.id] ?? ''} onChange={(e) => setReasons({ ...reasons, [c.id]: e.target.value })} style={{ maxWidth: 240 }} aria-label={`Reason for ${c.id}`} />
              <Button variant="danger" onClick={() => act(() => rejectChange(projectId, c.id, reasons[c.id] ?? ''))}>Reject</Button>
            </div>
          ) : null}
          {c.state === 'rejected' ? (
            <div className="row">
              <input placeholder="Reason to reopen" value={reasons[c.id] ?? ''} onChange={(e) => setReasons({ ...reasons, [c.id]: e.target.value })} style={{ maxWidth: 240 }} aria-label={`Reopen reason for ${c.id}`} />
              <Button variant="secondary" onClick={() => act(() => reopenChange(projectId, c.id, reasons[c.id] ?? ''))}>Reopen</Button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
