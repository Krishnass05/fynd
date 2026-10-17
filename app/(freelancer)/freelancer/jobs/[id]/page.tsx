'use client';
// Job detail, baseline scope & exclusions, and [ Accept Job / Open Project Workspace ]
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import fixture from '@/fixture.json';
import { applyToJob, getJob, listProjects } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Badge, Button, Card, ErrorMessage, Field, Spinner, money } from '@/components/ui';
import UnifiedWorkspace from '@/components/workspace/UnifiedWorkspace';

export default function JobApply() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useAsync(() => getJob(id), [id]);
  const projects = useAsync(listProjects, []);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  async function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await applyToJob(id, { pitch: String(f.get('pitch') ?? ''), proposedPrice: Number(f.get('price')) });
      setApplyError(null);
      await reload();
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Could not apply');
    }
  }

  const mine = data?.applications[0];
  const project = projects.data?.find((p) => p.jobId === id);

  if (workspaceOpen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          type="button"
          className="btn secondary pill-sm"
          onClick={() => setWorkspaceOpen(false)}
        >
          ← Back to Job Details
        </button>
        <UnifiedWorkspace
          projectId={project?.id || 'P1'}
          onClose={() => setWorkspaceOpen(false)}
        />
      </div>
    );
  }

  return (
    <>
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      {data ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: 24, color: 'var(--space-indigo)' }}>
                {data.job.title} <Badge>{data.job.status.replace('_', ' ')}</Badge>
              </h1>
              <p className="muted" style={{ margin: 0 }}>
                Budget {money(data.job.budget)} · deadline {data.job.deadline} · Case C35 ScopeDesk Active
              </p>
            </div>
            {project || mine?.status === 'accepted' || data.job.status === 'in_progress' ? (
              <button
                type="button"
                className="btn"
                onClick={() => setWorkspaceOpen(true)}
                style={{
                  background: 'var(--space-indigo)',
                  color: 'var(--seashell)',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                🚀 [ Accept Job / Open Project Workspace ]
              </button>
            ) : null}
          </div>

          <Card>
            <h3 style={{ margin: '0 0 8px', color: 'var(--space-indigo)' }}>Job Description</h3>
            <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>{data.job.description}</p>

            {/* Baseline Scope & Exclusions Breakdown */}
            <div
              style={{
                background: 'var(--seashell)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--space-indigo)', marginBottom: 10 }}>
                📋 Baseline Scope &amp; Legal Exclusions (Case C35 Fixture Data)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 6 }}>
                    ✅ INCLUDED SCOPE:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--dusty-grape)' }}>
                    {(fixture.scope?.included || ['one landing page', 'contact form']).map((item, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        <strong>{item}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 6 }}>
                    🚫 EXCLUDED SCOPE (Out of scope):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--dusty-grape)' }}>
                    {(fixture.scope?.excluded || ['payment checkout']).map((item, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        <span style={{ textDecoration: 'line-through' }}>{item}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                          (Requires approved Scope Change Order @ ₹1,000/hr)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Required Skills Badges */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dusty-grape)', marginBottom: 6 }}>
                Required Skills Badges:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['React', 'Node.js', 'WebRTC', 'UI Design', 'ScopeDesk'].map((s) => (
                  <span key={s} className="badge">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {mine ? (
            <Card title="Your Application Status">
              <Badge tone={mine.status === 'accepted' ? 'good' : mine.status === 'rejected' ? 'bad' : 'neutral'}>
                {mine.status}
              </Badge>
              <p style={{ marginTop: 8 }}>{mine.pitch}</p>
              <p className="muted">Your price {money(mine.proposedPrice)}</p>
              <button
                type="button"
                className="btn"
                onClick={() => setWorkspaceOpen(true)}
                style={{
                  marginTop: 10,
                  background: 'var(--space-indigo)',
                  color: 'var(--seashell)',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                🚀 [ Accept Job / Open Project Workspace ]
              </button>
            </Card>
          ) : data.job.status === 'open' ? (
            <Card title="Apply & Accept Job">
              <form onSubmit={apply}>
                <ErrorMessage message={applyError} />
                <Field label="Short pitch">
                  <textarea name="pitch" defaultValue="I can deliver the landing page and contact form within the 10-hour baseline." required rows={3} maxLength={1000} />
                </Field>
                <Field label="Your price (rupees)">
                  <input name="price" type="number" defaultValue={10000} min={1} step={1} required />
                </Field>
                <Button type="submit">Send Proposal / Accept Terms</Button>
              </form>
            </Card>
          ) : null}
        </>
      ) : null}
    </>
  );
}
