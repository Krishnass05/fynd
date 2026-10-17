'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('./fixture.json');
const { ScopeDesk, ValidationError, ConflictError, STATES } = require('./scopeDesk.js');

const fresh = () => ScopeDesk.fromFixture(fixture);
const find = (desk, id) => desk.requests().find((r) => r.id === id);

// ---- Case outcome checks, in the printed order ----

test('check 1: six extra hours at 1000/hr is a 6000 estimate before taxes', () => {
  const r1 = find(fresh(), 'R1');
  assert.equal(r1.classification, 'change');
  assert.equal(r1.state, STATES.QUOTED);
  assert.equal(r1.estimate.amount, 6000);
  assert.equal(r1.estimate.beforeTax, true);
});

test('check 2: a rejected change does not silently become committed work', () => {
  const desk = fresh();
  desk.reject('R1', 'Asha', 'client declined price');
  assert.equal(find(desk, 'R1').state, STATES.REJECTED);
  assert.equal(desk.committedValue(), 0);
  assert.equal(desk.committedHours(), 2); // only the R2 defect rework
  assert.throws(() => desk.approve('R1', 'Ravi'), ConflictError);
  // re-importing the same content must not revive it either
  desk.importRequests(fixture.requests);
  assert.equal(find(desk, 'R1').state, STATES.REJECTED);
  assert.equal(desk.committedValue(), 0);
});

test('check 3: importing the same request twice does not double-charge or double-book', () => {
  const desk = fresh();
  desk.approve('R1', 'Asha');
  const before = { v: desk.committedValue(), h: desk.committedHours() };
  const res = desk.importRequests(fixture.requests);
  assert.deepEqual(res.ignored.sort(), ['R1', 'R2']);
  assert.equal(desk.committedValue(), before.v);
  assert.equal(desk.committedHours(), before.h);
  assert.equal(desk.requests().length, 2);
  assert.equal(desk.audit().filter((a) => a.action === 'import_ignored').length, 2);
});

// ---- Fixture behaviour ----

test('defect rework is booked as effort and costs nothing', () => {
  const desk = fresh();
  const r2 = find(desk, 'R2');
  assert.equal(r2.state, STATES.DEFECT_REWORK);
  assert.equal(desk.committedHours(), 2);
  assert.equal(desk.committedValue(), 0);
});

test('approving R1 commits 6h and 6000, leaving 2h of 10', () => {
  const desk = fresh();
  desk.approve('R1', 'Asha');
  assert.equal(desk.committedHours(), 8);
  assert.equal(desk.committedValue(), 6000);
  assert.equal(desk.remainingHours(), 2);
});

// ---- Validation and null handling ----

test('null hours means unknown, never zero', () => {
  const desk = fresh();
  desk.importRequests([{ id: 'R3', text: 'Add payment checkout for gift cards', hours: null }]);
  const r3 = find(desk, 'R3');
  assert.equal(r3.state, STATES.NEEDS_CLARIFICATION);
  assert.equal(r3.estimate, null);
  assert.throws(() => desk.approve('R3', 'Asha'), ConflictError);
});

test('unclear request needs clarification', () => {
  const desk = fresh();
  desk.importRequests([{ id: 'R4', text: 'Make it pop', hours: 3 }]);
  assert.equal(find(desk, 'R4').state, STATES.NEEDS_CLARIFICATION);
});

test('bad input throws ValidationError and imports nothing', () => {
  const desk = fresh();
  assert.throws(() => desk.importRequests([{ id: 'X1', text: 'ok', hours: 1 }, { id: 'X2', text: 'bad', hours: -3 }]), ValidationError);
  assert.equal(desk.requests().length, 2);
  assert.throws(() => desk.importRequests('nope'), ValidationError);
  assert.throws(() => desk.importRequests([{ text: 'no id', hours: 1 }]), ValidationError);
  assert.throws(() => desk.importRequests([{ id: 'X3', text: 'x', hours: 'six' }]), ValidationError);
  assert.throws(() => desk.importRequests([{ id: 'D', text: 'a', hours: 1 }, { id: 'D', text: 'b', hours: 1 }]), ValidationError);
});

test('bad config throws ValidationError', () => {
  assert.throws(() => ScopeDesk.fromFixture({ ...fixture, ratePerHour: 0 }), ValidationError);
  assert.throws(() => ScopeDesk.fromFixture({ ...fixture, scope: null }), ValidationError);
  assert.throws(() => ScopeDesk.fromFixture(null), ValidationError);
});

// ---- Approval and capacity ----

test('approval over remaining capacity is refused', () => {
  const desk = fresh();
  desk.importRequests([{ id: 'R5', text: 'Add payment checkout v2', hours: 9 }]);
  assert.ok(find(desk, 'R5').warnings.some((w) => w.includes('Over capacity')));
  assert.throws(() => desk.approve('R5', 'Asha'), ConflictError);
  assert.equal(find(desk, 'R5').state, STATES.QUOTED);
});

test('conflicting approvals: double approve, reject after approve', () => {
  const desk = fresh();
  desk.approve('R1', 'Asha');
  assert.throws(() => desk.approve('R1', 'Ravi'), ConflictError);
  assert.throws(() => desk.reject('R1', 'Ravi', 'changed my mind'), ConflictError);
  assert.equal(find(desk, 'R1').decidedBy, 'Asha');
});

test('reopen sends a rejected request back to quoted and needs a reason', () => {
  const desk = fresh();
  desk.reject('R1', 'Asha', 'too dear');
  assert.throws(() => desk.reopen('R1', 'Asha'), ValidationError);
  desk.reopen('R1', 'Asha', 'client agreed to revisit');
  assert.equal(find(desk, 'R1').state, STATES.QUOTED);
  desk.approve('R1', 'Asha');
  assert.equal(desk.committedValue(), 6000);
});

// ---- Versioning, urgency, audit ----

test('changed content creates a new version and voids the old approval', () => {
  const desk = fresh();
  desk.approve('R1', 'Asha');
  desk.importRequests([{ id: 'R1', text: 'Add payment checkout', hours: 8 }]);
  const r1 = find(desk, 'R1');
  assert.equal(r1.version, 2);
  assert.equal(r1.state, STATES.QUOTED);
  assert.equal(desk.committedValue(), 0);
  assert.ok(desk.audit().some((a) => a.action === 'import_updated' && a.detail.approvalVoided === true));
});

test('urgent request applies a labelled rush multiplier', () => {
  const desk = fresh();
  desk.importRequests([{ id: 'R6', text: 'Add payment checkout', hours: 4, urgent: true }]);
  const est = find(desk, 'R6').estimate;
  assert.equal(est.multiplier, 1.5);
  assert.equal(est.amount, 6000);
  assert.ok(est.assumptions.some((a) => a.includes('assumption')));
});

test('every action is audited and snapshot is plain JSON', () => {
  const desk = fresh();
  desk.approve('R1', 'Asha');
  const snap = desk.snapshot();
  assert.deepEqual(snap.audit.map((a) => a.action), ['imported', 'imported', 'approved']);
  assert.deepEqual(snap.audit.map((a) => a.seq), [1, 2, 3]);
  assert.equal(snap.totals.committedValue, 6000);
  assert.deepEqual(JSON.parse(JSON.stringify(snap)), snap);
});
