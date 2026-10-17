'use client';
// The milestones of a project, with who can act on each. OWNER: Krishna.
// Props: projectId, milestones, summary, role, onChanged(project). The freelancer marks one ready; the client approves it.
// Record only: no money moves.
import { useState } from 'react';
import { approveMilestone, markMilestoneReady } from '@/lib/api';
import type { Milestone, MilestoneSummary, ProjectDetail, Role } from '@/lib/types';
import { Badge, Button, Card, ErrorMessage, money } from '@/components/ui';

const TONE = { pending: 'neutral', ready: 'warn', approved: 'good' } as const;
const LABEL = { pending: 'Not started', ready: 'Ready for review', approved: 'Approved' } as const;

export default function MilestoneList({ projectId, milestones, summary, role, onChanged }: {
  projectId: string;
  milestones: Milestone[];
  summary: MilestoneSummary;
  role: Role;
  onChanged: (p: ProjectDetail) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, fn: () => Promise<ProjectDetail>) {
    setBusyId(id);
    try {
      onChanged(await fn());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  if (!milestones.length) {
    return <Card title="Milestones" plain><p className="muted">No milestones on this project.</p></Card>;
  }
  const pct = summary.total ? (summary.approved / summary.total) * 100 : 0;
  return (
    <Card
      title="Milestones"
      badge={`${money(summary.approved)} of ${money(summary.total)} approved`}
      progress={{ value: pct, label: 'Approved' }}
      footer={<span>Remaining: <b>{money(summary.remaining)}</b> · record only, no money moves</span>}
    >
      <ErrorMessage message={error} />
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {milestones.map((m, i) => (
          <li key={m.id} className="row" style={{ justifyContent: 'space-between', background: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <strong>{i + 1}. {m.title}</strong>
              <div className="muted">
                {money(m.amount)}
                {m.status === 'approved' && m.approvedBy ? ` · approved by ${m.approvedBy}` : ''}
              </div>
            </div>
            <Badge tone={TONE[m.status]}>{LABEL[m.status]}</Badge>
            {role === 'freelancer' && m.status === 'pending' ? (
              <Button variant="secondary" disabled={busyId === m.id} onClick={() => act(m.id, () => markMilestoneReady(projectId, m.id))}>Mark ready</Button>
            ) : null}
            {role === 'client' && m.status !== 'approved' ? (
              <Button disabled={busyId === m.id} onClick={() => act(m.id, () => approveMilestone(projectId, m.id))}>Approve</Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
