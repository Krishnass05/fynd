'use strict';
// CSV helpers for the saved record. Values starting with = + - @ are prefixed
// with a quote so a spreadsheet will not run them as formulas.

function cell(v) {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@]/.test(s) && typeof v !== 'number') s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const row = (vals) => vals.map(cell).join(',');

function requestsCsv(snapshot) {
  const head = ['id', 'text', 'version', 'state', 'classification', 'hours', 'amount_before_tax', 'currency', 'urgent', 'decided_by', 'decision_reason', 'warnings'];
  const lines = [row(head)];
  for (const r of snapshot.requests) {
    lines.push(row([r.id, r.text, r.version, r.state, r.classification, r.hours,
      r.estimate ? r.estimate.amount : null, snapshot.currency, r.urgent, r.decidedBy, r.decisionReason, r.warnings.join(' | ')]));
  }
  return lines.join('\n') + '\n';
}

function auditCsv(snapshot) {
  const lines = [row(['seq', 'at', 'action', 'request_id', 'by', 'version', 'detail'])];
  for (const a of snapshot.audit) lines.push(row([a.seq, a.at, a.action, a.id, a.by, a.version, a.detail]));
  return lines.join('\n') + '\n';
}

module.exports = { requestsCsv, auditCsv };
