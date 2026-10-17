'use strict';
// UI only. Every rule lives in scopeDesk.js on the server; this file just calls the API and draws the result.

const $ = (id) => document.getElementById(id);
const STARTER = [
  { id: 'R1', text: 'Add payment checkout', hours: 6 },
  { id: 'R2', text: 'Fix our broken contact form', hours: 2, reason: 'defect rework' },
];
const LABELS = {
  needs_clarification: 'Needs clarification', quoted: 'Quoted, awaiting approval', approved: 'Approved',
  rejected: 'Rejected', defect_rework: 'Our defect, no charge', in_scope: 'In scope, no charge',
};

function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e[k] = v;
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return e;
}

let bannerTimer;
function banner(msg, kind = 'error') {
  const b = $('banner');
  b.textContent = msg;
  b.className = kind;
  b.hidden = false;
  clearTimeout(bannerTimer);
  if (kind === 'ok') bannerTimer = setTimeout(() => { b.hidden = true; }, 4000);
}

async function api(path, body) {
  let res;
  try {
    res = await fetch(path, body === undefined ? undefined : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Is it still running (npm start)?');
  }
  let data;
  try { data = await res.json(); } catch { throw new Error(`Server sent an unreadable reply (HTTP ${res.status})`); }
  if (!res.ok) throw new Error(data.error || `Request failed (HTTP ${res.status})`);
  return data;
}

// Run an action, show any failure as a message instead of crashing.
async function act(fn, okMsg) {
  try {
    const out = await fn();
    if (okMsg) banner(typeof okMsg === 'function' ? okMsg(out) : okMsg, 'ok'); else $('banner').hidden = true;
    return out;
  } catch (e) {
    banner(e.message);
    await refresh().catch(() => {});
    return null;
  }
}

const money = (n, cur) => `${cur === 'INR' ? '₹' : cur + ' '}${Number(n).toLocaleString('en-IN')}`;
const who = () => $('by').value.trim();

function renderTotals(s) {
  const t = s.totals;
  const pct = Math.min(100, Math.round((t.committedHours / (s.availableHours || 1)) * 100));
  const bar = el('div', { class: 'bar', role: 'img', 'aria-label': `${pct}% of capacity committed` }, el('span', { style: `width:${pct}%` }));
  $('totals').replaceChildren(
    el('div', { class: 'stat' }, el('div', { class: 'n' }, money(t.committedValue, s.currency)), el('div', { class: 'l' }, 'Approved change value, before tax')),
    el('div', { class: 'stat' }, el('div', { class: 'n' }, `${t.committedHours}h / ${s.availableHours}h`), el('div', { class: 'l' }, 'Committed hours (approved + defect + in scope)'), bar),
    el('div', { class: 'stat' }, el('div', { class: 'n' }, `${t.remainingHours}h`), el('div', { class: 'l' }, 'Capacity remaining')),
    el('div', { class: 'stat' }, el('div', { class: 'n' }, `${money(s.ratePerHour, s.currency)}/hr`), el('div', { class: 'l' }, 'Agreed rate')),
  );
}

function renderCard(r, s) {
  const reasonInput = el('input', { placeholder: 'Reason (optional)', 'aria-label': `Reason for ${r.id}` });
  const needReason = el('input', { placeholder: 'Reason to reopen', 'aria-label': `Reopen reason for ${r.id}` });
  const actions = el('div', { class: 'actions' });
  if (r.state === 'quoted') {
    actions.append(
      el('button', { onclick: () => act(async () => { render(await api('/api/approve', { id: r.id, by: who() })); }, `${r.id} approved`) }, 'Approve'),
      reasonInput,
      el('button', { class: 'danger', onclick: () => act(async () => { render(await api('/api/reject', { id: r.id, by: who(), reason: reasonInput.value })); }, `${r.id} rejected`) }, 'Reject'),
    );
  } else if (r.state === 'needs_clarification') {
    actions.append(
      reasonInput,
      el('button', { class: 'danger', onclick: () => act(async () => { render(await api('/api/reject', { id: r.id, by: who(), reason: reasonInput.value })); }, `${r.id} rejected`) }, 'Reject'),
    );
  } else if (r.state === 'rejected') {
    actions.append(
      needReason,
      el('button', { class: 'secondary', onclick: () => act(async () => { render(await api('/api/reopen', { id: r.id, by: who(), reason: needReason.value })); }, `${r.id} reopened`) }, 'Reopen'),
    );
  }

  const est = r.estimate && (r.classification === 'change' || r.urgent)
    ? el('div', { class: 'est' },
        el('span', { class: 'amt' }, money(r.estimate.amount, s.currency)),
        ` = ${r.estimate.hours}h × ${money(r.estimate.ratePerHour, s.currency)}${r.estimate.multiplier !== 1 ? ` × ${r.estimate.multiplier} rush` : ''}, before tax`,
        el('ul', { class: 'assume' }, r.estimate.assumptions.map((a) => el('li', {}, a))))
    : null;

  return el('article', { class: 'card' },
    el('div', { class: 'top' },
      el('div', {},
        el('div', { class: 'title' }, `${r.id}: ${r.text}`),
        el('div', { class: 'meta' }, `Version ${r.version} · ${r.classification === 'change' ? 'outside agreed scope' : r.classification === 'in_scope' ? 'inside agreed scope' : r.classification === 'defect' ? 'our own defect' : 'unclear'} · ${r.hours === null ? 'hours unknown' : r.hours + 'h'}${r.decidedBy ? ` · decided by ${r.decidedBy}` : ''}${r.decisionReason ? ` (${r.decisionReason})` : ''}`)),
      el('span', { class: `badge ${r.state}` }, LABELS[r.state] || r.state)),
    est,
    r.warnings.map((w) => el('div', { class: 'warn' }, w)),
    actions);
}

function renderAudit(s) {
  const body = document.querySelector('#audit tbody');
  body.replaceChildren(...[...s.audit].reverse().map((a) => el('tr', {},
    el('td', {}, a.seq), el('td', {}, new Date(a.at).toLocaleTimeString()), el('td', {}, a.action),
    el('td', {}, a.id), el('td', {}, a.version), el('td', {}, a.by || ''),
    el('td', { class: 'detail' }, JSON.stringify(a.detail)))));
}

function render(s) {
  renderTotals(s);
  $('requests').replaceChildren(...(s.requests.length ? s.requests.map((r) => renderCard(r, s)) : [el('p', { class: 'empty' }, 'No requests yet. Import some below.')]));
  renderAudit(s);
}

const refresh = async () => render(await api('/api/state'));

$('btn-fixture').onclick = () => { $('json').value = JSON.stringify(STARTER, null, 2); };

$('btn-import').onclick = () => act(async () => {
  let parsed;
  try { parsed = JSON.parse($('json').value); } catch (e) { throw new Error(`That is not valid JSON: ${e.message}`); }
  const out = await api('/api/import', { requests: parsed, by: who() || 'import' });
  render(out.state);
  const r = out.result;
  $('import-result').textContent = `Added ${r.added.length}, updated ${r.updated.length}, ignored ${r.ignored.length} duplicate(s).`;
  return out;
}, (out) => `Imported: ${out.result.added.length} added, ${out.result.updated.length} updated, ${out.result.ignored.length} ignored as duplicates`);

$('btn-reset').onclick = () => act(async () => { render(await api('/api/reset', {})); $('import-result').textContent = ''; }, 'Reset to the starter data');

$('add').onsubmit = (ev) => {
  ev.preventDefault();
  const f = ev.target;
  const hoursRaw = f.hours.value.trim();
  const req = { id: f.id.value.trim(), text: f.text.value.trim(), hours: hoursRaw === '' ? null : Number(hoursRaw) };
  if (f.urgent.checked) req.urgent = true;
  if (f.defect.checked) req.reason = 'defect rework';
  act(async () => { const out = await api('/api/import', { requests: [req], by: who() }); render(out.state); f.reset(); return out; },
    (out) => (out.result.ignored.length ? `${req.id} was already imported with the same content, nothing changed` : `${req.id} saved`));
};

$('btn-demo').onclick = () => act(async () => {
  const demo = await api('/api/demo');
  $('demo').replaceChildren(...demo.steps.map((s) => el('li', { class: s.pass ? 'pass' : 'fail' },
    el('strong', {}, `${s.n}. ${s.title}`), ' ', el('span', { class: 'badge ' + (s.pass ? 'approved' : 'rejected') }, s.pass ? 'PASS' : 'FAIL'),
    el('div', { class: 'k' }, 'Expected: ', s.expected), el('div', { class: 'k' }, 'Actual: ', s.actual))));
  return demo;
}, (d) => (d.allPassed ? 'All 3 checks passed' : 'A check failed, see below'));

$('json').value = JSON.stringify(STARTER, null, 2);
refresh().catch((e) => banner(e.message));
