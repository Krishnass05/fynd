'use client';
// Client project workspace: Overview, Capacity meter, SOW Versions, Amendment Upload, Change Order Review, and Chat.
// OWNER: Harini.
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { getProject } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import Chat from '@/components/chat/Chat';
import AmendmentUpload from '../AmendmentUpload';
import ChangeOrderReview from '../ChangeOrderReview';
import { Badge, Button, Card, EmptyState, ErrorMessage, Spinner, money } from '@/components/ui';
import styles from '../project.module.css';

export default function ClientProject() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload, setData } = useAsync(() => getProject(id), [id]);
  const [expandedSow, setExpandedSow] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <ErrorMessage message={error} />
      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spinner />
          <p className="muted" style={{ marginTop: 8 }}>Loading project workspace...</p>
        </div>
      ) : null}

      {data ? (
        <>
          {/* 1. Project Header */}
          <header className={styles.pageHeader}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ margin: 0 }}>{data.project.jobTitle}</h1>
                <div className={styles.projectMetaBar}>
                  <span className={styles.metaItem}>
                    Freelancer: <strong>{data.freelancer.name}</strong>
                  </span>
                  <span>•</span>
                  <span className={styles.metaItem}>
                    Base Rate: <strong>{money(data.project.ratePerHour)}/hr</strong>
                  </span>
                  <span>•</span>
                  <span className={styles.metaItem}>
                    Currency: <strong>{data.project.currency}</strong> (amounts before tax)
                  </span>
                  <span>•</span>
                  <span className="muted">ID: {data.project.id}</span>
                </div>
              </div>
              <Badge tone="neutral">Client Workspace</Badge>
            </div>
          </header>

          {/* 2. Capacity & Hours Meter */}
          <section className={styles.capacityCard} aria-labelledby="capacity-heading">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 id="capacity-heading" style={{ margin: 0, fontSize: 18 }}>
                Effort Capacity & Committed Value
              </h2>
              <Badge tone={data.totals.remainingHours <= 0 ? 'bad' : data.totals.remainingHours <= 5 ? 'warn' : 'good'}>
                {data.totals.remainingHours}h remaining
              </Badge>
            </div>

            <div className={styles.capacityGrid}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Available Capacity</div>
                <div className={styles.statValue}>{data.project.availableHours}h</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Committed Hours</div>
                <div className={styles.statValue} style={{ color: 'var(--brand)' }}>
                  {data.totals.committedHours}h
                </div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Remaining Hours</div>
                <div className={styles.statValue} style={{ color: data.totals.remainingHours <= 0 ? 'var(--bad)' : 'inherit' }}>
                  {data.totals.remainingHours}h
                </div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Approved Extra Value</div>
                <div className={styles.statValue} style={{ color: 'var(--ok)' }}>
                  {money(data.totals.committedValue)}
                </div>
                <div className={styles.taxDisclaimer}>Before Tax</div>
              </div>
            </div>

            {/* Visual Capacity Meter Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Capacity Utilization</span>
                <strong>
                  {data.totals.utilization !== null ? `${Math.round(data.totals.utilization * 100)}%` : '—'}
                </strong>
              </div>
              <div className={styles.progressBarContainer}>
                <div
                  className={`${styles.progressBarFill} ${
                    data.totals.remainingHours <= 0
                      ? styles.progressBarFillOver
                      : data.totals.remainingHours <= 5
                      ? styles.progressBarFillWarning
                      : ''
                  }`}
                  style={{
                    width: `${Math.min(100, (data.totals.committedHours / Math.max(1, data.project.availableHours)) * 100)}%`,
                  }}
                  role="progressbar"
                  aria-valuenow={data.totals.committedHours}
                  aria-valuemin={0}
                  aria-valuemax={data.project.availableHours}
                />
              </div>
              <div className={styles.capacitySubtext}>
                <span>Only approved changes and booked defect rework count against committed hours.</span>
                <span>Rejections never count toward committed scope.</span>
              </div>
            </div>
          </section>

          {/* 3. SOW Versions History */}
          <Card title="Statement of Work (SOW) Versions">
            <p className="muted" style={{ margin: '0 0 12px', fontSize: 14 }}>
              The baseline SOW sets initial deliverables and exclusions. When new amendments are uploaded,
              they are compared to detect additions, changes, and exclusions.
            </p>

            {data.sowDocuments.length === 0 ? (
              <EmptyState>
                No signed SOW uploaded yet. The freelancer uploads the initial baseline SOW to establish scope.
              </EmptyState>
            ) : (
              <div>
                {data.sowDocuments.map((s) => {
                  const isExpanded = expandedSow === s.id;
                  const deliverableCount = s.items.filter((i) => i.section !== 'excluded').length;
                  const excludedCount = s.items.filter((i) => i.section === 'excluded').length;

                  return (
                    <div key={s.id} className={styles.sowVersionItem}>
                      <div>
                        <div className={styles.sowVersionTitle}>
                          <span>Version {s.version}</span>
                          <Badge tone={s.kind === 'baseline' ? 'good' : 'warn'}>
                            {s.kind === 'baseline' ? 'Signed Baseline' : 'Amended SOW'}
                          </Badge>
                          <span style={{ fontWeight: 400, color: 'var(--ink)' }}>{s.filename}</span>
                        </div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          Uploaded {new Date(s.uploadedAt).toLocaleString()} • {deliverableCount} deliverables, {excludedCount} excluded items
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Button
                          variant="secondary"
                          onClick={() => setExpandedSow(isExpanded ? null : s.id)}
                          style={{ fontSize: 13, padding: '4px 12px' }}
                        >
                          {isExpanded ? 'Hide Items' : 'View Scope Items'}
                        </Button>
                      </div>

                      {isExpanded ? (
                        <div style={{ width: '100%', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                          <h4 style={{ margin: '6px 0 8px', fontSize: 14 }}>Included Deliverables</h4>
                          <ul style={{ margin: '0 0 12px', paddingLeft: 20, fontSize: 13 }}>
                            {s.items
                              .filter((i) => i.section !== 'excluded')
                              .map((item, idx) => (
                                <li key={idx} style={{ marginBottom: 4 }}>
                                  {item.text} {item.hours !== null ? `(${item.hours}h)` : ''}
                                </li>
                              ))}
                          </ul>

                          {excludedCount > 0 ? (
                            <>
                              <h4 style={{ margin: '6px 0 8px', fontSize: 14, color: 'var(--warn)' }}>
                                Excluded Items (Requires Change Order)
                              </h4>
                              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--muted)' }}>
                                {s.items
                                  .filter((i) => i.section === 'excluded')
                                  .map((item, idx) => (
                                    <li key={idx} style={{ marginBottom: 4 }}>
                                      {item.text}
                                    </li>
                                  ))}
                              </ul>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 4. Upload an Amendment (only if baseline SOW exists) */}
          {data.sowDocuments.some((s) => s.kind === 'baseline') ? (
            <AmendmentUpload projectId={id} onDone={() => void reload()} />
          ) : (
            <Card title="Upload an Amendment">
              <p className="muted" style={{ margin: 0 }}>
                Please wait for the freelancer to upload the signed baseline SOW before uploading amendments.
              </p>
            </Card>
          )}

          {/* 5. Change Orders Review Section */}
          <section aria-labelledby="change-orders-heading">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 28, marginBottom: 8 }}>
              <h2 id="change-orders-heading" style={{ margin: 0 }}>
                Change Orders & Scope Decisions
              </h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge tone="neutral">{data.changeRequests.length} Total</Badge>
                <Badge tone="good">
                  {data.changeRequests.filter((c) => c.state === 'approved').length} Approved
                </Badge>
                <Badge tone="warn">
                  {data.changeRequests.filter((c) => c.state === 'quoted').length} Awaiting Decision
                </Badge>
                <Badge tone="bad">
                  {data.changeRequests.filter((c) => c.state === 'rejected').length} Rejected
                </Badge>
              </div>
            </div>

            <p className="muted" style={{ margin: '0 0 12px' }}>
              Review each scope modification below. Pricing is calculated at <strong>{money(data.project.ratePerHour)}/hr</strong> before tax.
              Rejection immediately ensures extra hours are not booked against your budget.
            </p>

            <ChangeOrderReview
              projectId={id}
              changes={data.changeRequests}
              canDecide={true}
              onChanged={setData}
            />
          </section>

          {/* 6. Workspace Chat */}
          <section aria-labelledby="chat-heading" style={{ marginTop: 28 }}>
            <h2 id="chat-heading" style={{ margin: '0 0 8px' }}>Project Workspace Chat</h2>
            <p className="muted" style={{ margin: '0 0 14px' }}>
              Direct line between you and {data.freelancer.name} for clarification, design reviews, and scope discussions.
            </p>
            <Card>
              <Chat projectId={id} role="client" />
            </Card>
          </section>

          {/* 7. Audit Trail (Collapsible) */}
          <div style={{ marginTop: 32, marginBottom: 40, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted" style={{ fontWeight: 600 }}>Project Audit Trail & Decisions Log</span>
              <button
                type="button"
                onClick={() => setShowAudit(!showAudit)}
                style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 13 }}
              >
                {showAudit ? 'Hide Audit Log' : `View Full Audit Trail (${data.audit.length} entries)`}
              </button>
            </div>

            {showAudit ? (
              <div style={{ marginTop: 12, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 14 }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', color: 'var(--muted)' }}>
                      <th style={{ padding: '6px 8px' }}>Seq</th>
                      <th style={{ padding: '6px 8px' }}>Action</th>
                      <th style={{ padding: '6px 8px' }}>Entity</th>
                      <th style={{ padding: '6px 8px' }}>By</th>
                      <th style={{ padding: '6px 8px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.audit.map((a) => (
                      <tr key={a.seq} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '6px 8px' }}>#{a.seq}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{a.action}</td>
                        <td style={{ padding: '6px 8px' }}>{a.id}</td>
                        <td style={{ padding: '6px 8px' }}>{a.by ?? 'system'}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>{new Date(a.at).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
