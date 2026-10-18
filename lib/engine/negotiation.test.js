'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Negotiations, makeOffer, MAX_OFFERS } = require('./negotiation.js');
const { ValidationError, ConflictError } = require('./scopeDesk.js');

let t = 0;
const clock = () => new Date(Date.UTC(2026, 9, 18, 9, 0, t++)).toISOString();
const book = () => new Negotiations({ now: clock });
const task = (ref = 'P1:blog page') => ({ kind: 'task', ref });

test('check 1: six extra hours at Rs 1000 an hour is Rs 6000 before tax', () => {
  const b = book();
  const { negotiation: n } = b.open(task(), 'freelancer', { hours: 6, ratePerHour: 1000 });
  assert.equal(n.latest.price, 6000);
  assert.equal(n.latest.basis, 'hours_x_rate');
  assert.equal(n.latest.beforeTax, true);
  const done = b.accept(n.id, 'client');
  assert.equal(done.status, 'agreed');
  assert.equal(done.agreed.price, 6000);
  assert.deepEqual(b.committed(), { count: 1, price: 6000, hours: 6, unknownHours: 0, beforeTax: true });
});

test('check 2: a declined or still-open negotiation never becomes committed work', () => {
  const b = book();
  const a = b.open(task('P1:blog'), 'freelancer', { hours: 6, ratePerHour: 1000 }).negotiation;
  b.decline(a.id, 'client', 'Not this month');
  b.open(task('P1:seo'), 'freelancer', { hours: 4, ratePerHour: 1000 }); // left open
  assert.deepEqual(b.committed(), { count: 0, price: 0, hours: 0, unknownHours: 0, beforeTax: true });
  assert.throws(() => b.accept(a.id, 'freelancer'), ConflictError, 'a declined one cannot be accepted afterwards');
  assert.throws(() => b.accept(a.id, 'client'), ConflictError);
  assert.throws(() => b.counter(a.id, 'freelancer', { hours: 5, ratePerHour: 1000 }), ConflictError, 'nor reopened by countering');
});

test('check 3: the same request twice does not double-book or double-charge', () => {
  const b = book();
  const first = b.open(task('P1:Blog page'), 'freelancer', { hours: 6, ratePerHour: 1000 });
  const again = b.open(task('p1:blog page '), 'freelancer', { hours: 6, ratePerHour: 1000 });
  assert.equal(first.created, true);
  assert.equal(again.created, false);
  assert.equal(again.negotiation.id, first.negotiation.id);
  b.accept(first.negotiation.id, 'client');
  assert.equal(b.open(task('P1:blog page'), 'client', { hours: 6, ratePerHour: 1000 }).created, false, 'also after it was agreed');
  assert.throws(() => b.accept(first.negotiation.id, 'client'), ConflictError, 'accepting twice is refused');
  assert.equal(b.committed().price, 6000);
  assert.equal(b.list().length, 1);
  assert.ok(b.view(first.negotiation.id).events.some((e) => e.action === 'repeat_ignored'), 'the ignored repeat is recorded');
});

test('back and forth: counter until one side accepts the other side\'s latest offer', () => {
  const b = book();
  const { negotiation: n } = b.open({ kind: 'hire', ref: 'J108' }, 'freelancer', { price: 30000, note: 'Includes two revision rounds' });
  assert.equal(n.waitingFor, 'client');
  let v = b.counter(n.id, 'client', { price: 25000, due: '2026-11-30', note: 'Budget is 27500' });
  assert.equal(v.waitingFor, 'freelancer');
  v = b.counter(n.id, 'freelancer', { price: 27500, due: '2026-11-30' });
  v = b.accept(n.id, 'client');
  assert.equal(v.agreed.price, 27500);
  assert.equal(v.agreed.by, 'freelancer', 'the agreed offer is the one the freelancer made');
  assert.equal(v.agreed.acceptedBy, 'client');
  assert.equal(v.agreed.due, '2026-11-30');
  assert.deepEqual(v.offers.map((o) => [o.n, o.by, o.price]), [[1, 'freelancer', 30000], [2, 'client', 25000], [3, 'freelancer', 27500]], 'the full history stays');
  assert.deepEqual(v.events.map((e) => e.action), ['opened', 'countered', 'countered', 'accepted']);
  assert.equal(v.waitingFor, null);
});

test('conflicting approvals: nobody accepts their own offer or answers twice in a row', () => {
  const b = book();
  const { negotiation: n } = b.open(task(), 'freelancer', { hours: 6, ratePerHour: 1000 });
  assert.throws(() => b.accept(n.id, 'freelancer'), /cannot accept your own offer/);
  assert.throws(() => b.counter(n.id, 'freelancer', { hours: 5, ratePerHour: 1000 }), /Waiting for the client/);
  b.counter(n.id, 'client', { hours: 4, ratePerHour: 1000 });
  assert.throws(() => b.accept(n.id, 'client'), /cannot accept your own offer/, 'the client cannot accept the client\'s own counter');
  assert.equal(b.accept(n.id, 'freelancer').agreed.price, 4000);
});

test('unknown hours mean no price, and such an offer cannot be accepted', () => {
  const b = book();
  const { negotiation: n } = b.open(task(), 'client', { hours: null, note: 'Add a blog page' });
  assert.equal(n.latest.price, null, 'unknown, not zero');
  assert.equal(n.latest.basis, 'unknown');
  assert.equal(n.canAccept, false);
  assert.throws(() => b.accept(n.id, 'freelancer'), /no price yet/);
  const v = b.counter(n.id, 'freelancer', { hours: 6, ratePerHour: 1000 });
  assert.equal(v.canAccept, true);
  assert.equal(b.accept(n.id, 'client').agreed.price, 6000);
});

test('urgent work: the rush fee is applied and labelled as an assumption', () => {
  const o = makeOffer({ hours: 6, ratePerHour: 1000, rush: true });
  assert.equal(o.price, 9000);
  assert.match(o.assumptions[0], /assumption/);
  assert.deepEqual(makeOffer({ hours: 6, ratePerHour: 1000 }).assumptions, []);
  assert.equal(makeOffer({ hours: 2.5, ratePerHour: 999 }).price, 2498, 'rounded to whole rupees');
  assert.equal(makeOffer({ hours: 2, ratePerHour: 1000, price: undefined }).price, 2000);
  assert.equal(makeOffer({ price: 0, note: 'Fix of our own bug' }).price, 0, 'a free fix is a real price of zero');
});

test('bad input gives clear messages', () => {
  const bad = [
    [{ hours: -1, ratePerHour: 1000 }, /hours must be/],
    [{ hours: 'six', ratePerHour: 1000 }, /hours must be/],
    [{ hours: 6, ratePerHour: 0 }, /ratePerHour/],
    [{ price: 99.5 }, /whole number/],
    [{ price: -5 }, /whole number/],
    [{ hours: 6, ratePerHour: 1000, price: 6000 }, /not both/],
    [{ price: 6000, rush: true }, /rush fee/],
    [{ hours: 6, ratePerHour: 1000, due: '30/11/2026' }, /date like/],
    [{ hours: 6, ratePerHour: 1000, due: '2026-02-31' }, /real date/],
    [{ hours: 6, ratePerHour: 1000, note: 'x'.repeat(1001) }, /note/],
  ];
  for (const [input, msg] of bad) assert.throws(() => makeOffer(input), (e) => e instanceof ValidationError && msg.test(e.message), JSON.stringify(input).slice(0, 60));
  const b = book();
  assert.throws(() => b.open({ kind: 'gift', ref: 'x' }, 'client', { price: 1 }), /subject.kind/);
  assert.throws(() => b.open({ kind: 'task', ref: ' ' }, 'client', { price: 1 }), /subject.ref/);
  assert.throws(() => b.open(task(), 'boss', { price: 1 }), /client or freelancer/);
  const { negotiation: n } = b.open(task(), 'client', { price: 1000 });
  assert.throws(() => b.decline(n.id, 'freelancer', '  '), /Say why/);
  assert.throws(() => b.accept('N999', 'client'), /Unknown negotiation/);
});

test('either side can decline, including withdrawing their own offer, with the reason kept', () => {
  const b = book();
  const { negotiation: n } = b.open(task(), 'freelancer', { hours: 6, ratePerHour: 1000 });
  const v = b.decline(n.id, 'freelancer', 'Withdrawn: I misread the request');
  assert.equal(v.status, 'declined');
  assert.equal(v.closedBy, 'freelancer');
  assert.equal(v.closedReason, 'Withdrawn: I misread the request');
  assert.equal(b.open(task(), 'freelancer', { hours: 3, ratePerHour: 1000 }).created, true, 'after a decline a fresh offer can start');
});

test('a negotiation that never settles is stopped after the maximum number of offers', () => {
  const b = book();
  const { negotiation: n } = b.open(task(), 'freelancer', { hours: 6, ratePerHour: 1000 });
  let side = 'client';
  for (let i = 1; i < MAX_OFFERS; i += 1) { b.counter(n.id, side, { hours: 6 - (i % 2), ratePerHour: 1000 }); side = side === 'client' ? 'freelancer' : 'client'; }
  assert.throws(() => b.counter(n.id, side, { hours: 5, ratePerHour: 1000 }), /No agreement after/);
  assert.equal(b.accept(n.id, side).status, 'agreed', 'the latest offer can still be accepted');
});

test('committed totals filter by kind and project, and fixed prices without hours are counted apart', () => {
  const b = book();
  const a = b.open(task('P1:blog'), 'freelancer', { hours: 6, ratePerHour: 1000 }).negotiation;
  const c = b.open(task('P2:logo'), 'freelancer', { price: 5000 }).negotiation;
  const h = b.open({ kind: 'hire', ref: 'J1' }, 'freelancer', { price: 30000 }).negotiation;
  for (const n of [a, c, h]) b.accept(n.id, 'client');
  assert.equal(b.committed({ kind: 'task' }).price, 11000);
  assert.deepEqual(b.committed({ kind: 'task', refPrefix: 'P1:' }), { count: 1, price: 6000, hours: 6, unknownHours: 0, beforeTax: true });
  assert.equal(b.committed({ refPrefix: 'P2:' }).unknownHours, 1);
});

test('saved and loaded again, everything carries on where it was', () => {
  const b = book();
  const { negotiation: n } = b.open(task(), 'freelancer', { hours: 6, ratePerHour: 1000 });
  b.counter(n.id, 'client', { hours: 5, ratePerHour: 1000 });
  const copy = Negotiations.fromState(JSON.parse(JSON.stringify(b.toState())), { now: clock });
  assert.deepEqual(copy.view(n.id).offers, b.view(n.id).offers);
  assert.equal(copy.accept(n.id, 'freelancer').agreed.price, 5000);
  assert.equal(copy.open(task('P1:other'), 'client', { price: 1 }).negotiation.id, 'N2', 'numbering continues');
  assert.equal(Negotiations.fromState(null).list().length, 0, 'empty or missing state is fine');
});

test('a view is a copy: changing it does not change the record', () => {
  const b = book();
  const { negotiation: n } = b.open(task(), 'freelancer', { hours: 6, ratePerHour: 1000 });
  n.latest.price = 1;
  n.offers.push({});
  assert.equal(b.view(n.id).latest.price, 6000);
  assert.equal(b.view(n.id).offers.length, 1);
});
