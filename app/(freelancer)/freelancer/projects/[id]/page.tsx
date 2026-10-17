'use client';
// Freelancer project workspace: Step 4 Project Chat Box + Freemium WebRTC Call Gate + Meta-Style AI + C35 Scope Desk
import { useParams } from 'next/navigation';
import { useState } from 'react';
import UnifiedWorkspace from '@/components/workspace/UnifiedWorkspace';
import SowUpload from '@/components/sow/SowUpload';
import ChangeList from '@/components/changes/ChangeList';
import { getProject } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Card, ErrorMessage, Spinner, money } from '@/components/ui';

export default function FreelancerProject() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload, setData } = useAsync(() => getProject(id), [id]);
  const [viewMode, setViewMode] = useState<'interactive' | 'documents'>('interactive');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--card)',
          padding: '12px 20px',
          borderRadius: 14,
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--space-indigo)' }}>
            Project Workspace ({id})
          </span>
          <span className="badge pro">Case C35 Flagship</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn pill-sm"
            style={{
              background: viewMode === 'interactive' ? 'var(--space-indigo)' : 'transparent',
              color: viewMode === 'interactive' ? 'var(--seashell)' : 'var(--dusty-grape)',
              border: '1px solid var(--border)',
            }}
            onClick={() => setViewMode('interactive')}
          >
            [Live] Unified Workspace (Chat, Call &amp; ScopeDesk)
          </button>
          <button
            type="button"
            className="btn pill-sm"
            style={{
              background: viewMode === 'documents' ? 'var(--space-indigo)' : 'transparent',
              color: viewMode === 'documents' ? 'var(--seashell)' : 'var(--dusty-grape)',
              border: '1px solid var(--border)',
            }}
            onClick={() => setViewMode('documents')}
          >
            [Docs] SOW Uploads &amp; Change Orders
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}

      {viewMode === 'interactive' ? (
        <UnifiedWorkspace projectId={id} />
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1>{data.project.jobTitle}</h1>
          <p className="muted">
            For {data.client.name} · rate {money(data.project.ratePerHour)}/hr · amounts before tax
          </p>
          <Card title="Capacity">
            <p>
              {data.totals.committedHours}h of {data.project.availableHours}h committed ·{' '}
              {data.totals.remainingHours}h remaining · approved changes {money(data.totals.committedValue)}
            </p>
          </Card>
          <Card title="SOW versions">
            {data.sowDocuments.length ? (
              data.sowDocuments.map((s) => (
                <p key={s.id}>
                  v{s.version} {s.kind}: {s.filename} ({s.items.length} items)
                </p>
              ))
            ) : (
              <p className="muted">No signed SOW yet.</p>
            )}
          </Card>
          {!data.sowDocuments.some((s) => s.kind === 'baseline') ? (
            <Card title="Upload the signed SOW">
              <SowUpload projectId={id} kind="baseline" onDone={() => void reload()} />
            </Card>
          ) : null}
          <h2>Change orders</h2>
          <ChangeList projectId={id} changes={data.changeRequests} canDecide={false} onChanged={setData} />
        </div>
      ) : null}
    </div>
  );
}
