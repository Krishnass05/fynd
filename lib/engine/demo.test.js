'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { runDemo } = require('./demo.js');
const { requestsCsv, auditCsv } = require('./exporter.js');

test('demo runs the three checks in order and all pass', () => {
  const d = runDemo();
  assert.equal(d.allPassed, true);
  assert.deepEqual(d.steps.map((s) => s.n), [1, 2, 3]);
});

test('CSV export escapes quotes and neutralises formulas', () => {
  const snap = { currency: 'INR', requests: [{ id: 'A', text: '=cmd|"x", y', version: 1, state: 'quoted', classification: 'change', hours: 1, estimate: { amount: 1000 }, urgent: false, decidedBy: null, decisionReason: null, warnings: [] }], audit: [] };
  const csv = requestsCsv(snap);
  assert.ok(csv.includes(`"'=cmd|""x"", y"`));
  assert.equal(auditCsv(snap).trim().split('\n').length, 1);
});
