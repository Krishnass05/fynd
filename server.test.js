'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./server.js');
const { runDemo } = require('./demo.js');
const { requestsCsv, auditCsv } = require('./exporter.js');

async function withServer(fn) {
  const { server } = createApp({ saveFile: null });
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  try { await fn(base); } finally { server.close(); }
}
const post = (base, p, body) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('demo runs the three checks in order and all pass', () => {
  const d = runDemo();
  assert.equal(d.allPassed, true);
  assert.deepEqual(d.steps.map((s) => s.n), [1, 2, 3]);
});

test('API: approve, then conflicting approve returns 409 with a message', () => withServer(async (b) => {
  assert.equal((await post(b, '/api/approve', { id: 'R1', by: 'Asha' })).status, 200);
  const res = await post(b, '/api/approve', { id: 'R1', by: 'Ravi' });
  assert.equal(res.status, 409);
  assert.match((await res.json()).error, /already approved/);
}));

test('API: bad JSON, bad hours and unknown route give clear errors, not crashes', () => withServer(async (b) => {
  const bad = await post(b, '/api/import', '{not json');
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /valid JSON/);
  const neg = await post(b, '/api/import', { requests: [{ id: 'Z', text: 'x', hours: -2 }] });
  assert.equal(neg.status, 400);
  assert.equal((await fetch(b + '/api/nope')).status, 404);
  assert.equal((await fetch(b + '/api/state')).status, 200);
}));

test('API: repeated import is ignored; state endpoint shows no double booking', () => withServer(async (b) => {
  await post(b, '/api/approve', { id: 'R1', by: 'Asha' });
  const fx = await (await fetch(b + '/api/fixture')).json();
  const out = await (await post(b, '/api/import', { requests: fx.requests })).json();
  assert.equal(out.result.ignored.length, 2);
  assert.equal(out.state.totals.committedValue, 6000);
  assert.equal(out.state.totals.committedHours, 8);
}));

test('static files served; path traversal and unknown types refused', () => withServer(async (b) => {
  assert.equal((await fetch(b + '/')).status, 200);
  assert.equal((await fetch(b + '/app.js')).status, 200);
  assert.equal((await fetch(b + '/..%2Fpackage.json')).status, 404);
  assert.equal((await fetch(b + '/..%2Fserver.js')).status, 404);
}));

test('CSV export escapes quotes and neutralises formulas', () => {
  const snap = { currency: 'INR', requests: [{ id: 'A', text: '=cmd|"x", y', version: 1, state: 'quoted', classification: 'change', hours: 1, estimate: { amount: 1000 }, urgent: false, decidedBy: null, decisionReason: null, warnings: [] }], audit: [] };
  const csv = requestsCsv(snap);
  assert.ok(csv.includes(`"'=cmd|""x"", y"`));
  assert.equal(auditCsv(snap).trim().split('\n').length, 1);
});
