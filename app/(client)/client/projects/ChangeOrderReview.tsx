'use client';
// Change Order Review Table with pricing before tax, anomaly flags, and approve/reject/reopen actions. OWNER: Harini.
import { useState } from 'react';
import { approveChange, rejectChange, reopenChange } from '@/lib/api';
import type { ChangeRequest, Flag, ProjectDetail } from '@/lib/types';
import { Badge, Button, EmptyState, ErrorMessage, money } from '@/components/ui';
import styles from './project.module.css';

export interface ChangeOrderReviewProps {
  projectId: string;
  changes: ChangeRequest[];
  canDecide: boolean;
  onChanged: (p: ProjectDetail) => void;
}

export default function ChangeOrderReview({
  projectId,
  changes,
  canDecide,
  onChanged,
}: ChangeOrderReviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  async function handleAction(changeId: string, actionFn: () => Promise<ProjectDetail>) {
    setActingId(changeId);
    setError(null);
    try {
      const updated = await actionFn();
      onChanged(updated);
      setReasons((prev) => ({ ...prev, [changeId]: '' }));
    } catch (err) {
      // Show server error message cleanly rather than crashing
      const msg = err instanceof Error ? err.message : 'Action failed';
      setError(msg);
    } finally {
      setActingId(null);
    }
  }

  if (!changes || changes.length === 0) {
    return <EmptyState>No change orders generated yet for this project.</EmptyState>;
  }

  const getStateTone = (state: string): 'good' | 'bad' | 'warn' | 'neutral' => {
    switch (state) {
      case 'approved':
        return 'good';
      case 'rejected':
        return 'bad';
      case 'needs_clarification':
        return 'warn';
      case 'quoted':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getLabelTone = (label: string | null): 'good' | 'bad' | 'warn' | 'neutral' => {
    switch (label) {
      case 'previously_excluded':
        return 'bad';
      case 'changed':
      case 'new':
        return 'warn';
      default:
        return 'neutral';
    }
  };

  return (
    <div>
      <ErrorMessage message={error} />

      <div className={styles.tableWrapper}>
        <table className={styles.changeTable} aria-label="Change orders review table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Item / Request</th>
              <th style={{ width: '13%' }}>Scope Label</th>
              <th style={{ width: '9%' }}>Hours</th>
              <th style={{ width: '18%' }}>Price (Before Tax)</th>
              <th style={{ width: '20%' }}>Anomaly Flags & Reasons</th>
              <th style={{ width: '18%' }}>Status & Decision</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => {
              const isActing = actingId === c.id;
              const isRejected = c.state === 'rejected';
              const isApproved = c.state === 'approved';

              return (
                <tr
                  key={c.id}
                  className={
                    isRejected
                      ? styles.changeRowRejected
                      : isApproved
                      ? styles.changeRowApproved
                      : undefined
                  }
                >
                  {/* Item Description */}
                  <td>
                    <div className={styles.itemHeading}>{c.text}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      ID: <strong>{c.id}</strong> • Version: v{c.version}
                    </div>
                    {c.reason ? (
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        Context: {c.reason}
                      </div>
                    ) : null}
                  </td>

                  {/* Scope Label */}
                  <td>
                    {c.label ? (
                      <Badge tone={getLabelTone(c.label)}>
                        {c.label === 'previously_excluded' ? 'previously excluded' : c.label}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">{c.classification}</Badge>
                    )}
                  </td>

                  {/* Hours: MUST be "unknown" if null, NEVER 0! */}
                  <td>
                    {c.hours !== null ? (
                      <span style={{ fontWeight: 600 }}>{c.hours}h</span>
                    ) : (
                      <span className={styles.hoursUnknown}>unknown</span>
                    )}
                  </td>

                  {/* Price Before Tax & Assumptions */}
                  <td>
                    {c.estimate ? (
                      <div>
                        <div className={styles.priceBeforeTax}>{money(c.estimate.amount)}</div>
                        <div className={styles.taxDisclaimer}>Before Tax</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                          {c.estimate.hours}h × {money(c.estimate.ratePerHour)}/hr
                          {c.estimate.multiplier !== 1 ? ` (${c.estimate.multiplier}x rush)` : ''}
                        </div>
                        {c.estimate.assumptions && c.estimate.assumptions.length > 0 ? (
                          <div className={styles.itemAssumptions}>
                            Assumptions: {c.estimate.assumptions.join('; ')}
                          </div>
                        ) : null}
                      </div>
                    ) : c.hours === null ? (
                      <div>
                        <span className="muted" style={{ fontSize: 13 }}>
                          Pending hours clarification
                        </span>
                        <div className={styles.taxDisclaimer}>Pricing unquoted</div>
                      </div>
                    ) : (
                      <span className="muted" style={{ fontSize: 13 }}>
                        {c.classification === 'defect' ? '₹0 (Defect rework)' : 'Included in scope'}
                      </span>
                    )}
                  </td>

                  {/* Anomaly Flags & Reasons */}
                  <td>
                    {c.flags.length > 0 || c.warnings.length > 0 ? (
                      <div className={styles.flagsContainer}>
                        {c.flags.map((f: Flag) => (
                          <div
                            key={f.code}
                            className={`${styles.flagBadge} ${
                              f.code === 'over_capacity' || f.code === 'previously_excluded'
                                ? styles.flagBadgeDanger
                                : ''
                            }`}
                            title={f.message}
                          >
                            <span>⚠️</span>
                            <span>{f.message}</span>
                          </div>
                        ))}
                        {c.warnings.map((w, wIdx) => (
                          <div key={wIdx} className={`${styles.flagBadge} ${styles.flagBadgeDanger}`}>
                            <span>🛑</span>
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>

                  {/* Status & Decision Action Cell */}
                  <td className={styles.actionCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      <Badge tone={getStateTone(c.state)}>
                        {c.state.replace('_', ' ')}
                      </Badge>
                      {isRejected ? (
                        <span className={styles.rejectionNotice}>
                          Excluded from committed hours (0h, ₹0)
                        </span>
                      ) : null}
                    </div>

                    {c.decidedBy ? (
                      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                        Decided by <strong>{c.decidedBy}</strong>
                        {c.decisionReason ? ` ("${c.decisionReason}")` : ''}
                      </div>
                    ) : null}

                    {/* Action Form for Quoted Changes */}
                    {canDecide && c.state === 'quoted' ? (
                      <div>
                        <input
                          type="text"
                          placeholder="Reason (required for reject)"
                          value={reasons[c.id] ?? ''}
                          onChange={(e) =>
                            setReasons({ ...reasons, [c.id]: e.target.value })
                          }
                          className={styles.reasonInput}
                          aria-label={`Decision reason for ${c.id}`}
                          disabled={isActing}
                        />
                        <div className={styles.actionButtonGroup}>
                          <Button
                            onClick={() =>
                              handleAction(c.id, () => approveChange(projectId, c.id))
                            }
                            disabled={isActing}
                          >
                            {isActing ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() =>
                              handleAction(c.id, () =>
                                rejectChange(projectId, c.id, reasons[c.id] ?? '')
                              )
                            }
                            disabled={isActing}
                          >
                            {isActing ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {/* Reopen Action for Rejected Changes */}
                    {c.state === 'rejected' ? (
                      <div style={{ marginTop: 8 }}>
                        <input
                          type="text"
                          placeholder="Reason to reopen..."
                          value={reasons[c.id] ?? ''}
                          onChange={(e) =>
                            setReasons({ ...reasons, [c.id]: e.target.value })
                          }
                          className={styles.reasonInput}
                          aria-label={`Reopen reason for ${c.id}`}
                          disabled={isActing}
                        />
                        <Button
                          variant="secondary"
                          onClick={() =>
                            handleAction(c.id, () =>
                              reopenChange(projectId, c.id, reasons[c.id] ?? '')
                            )
                          }
                          disabled={isActing || !(reasons[c.id] ?? '').trim()}
                        >
                          {isActing ? 'Reopening...' : 'Reopen Request'}
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
