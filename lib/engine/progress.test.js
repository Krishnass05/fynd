'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkMove, computeProgress, istDay, checkinStatus, MoveError } = require('./progress.js');

test('progress is approved hours over all known hours, so a big task counts more', () => {
  const p = computeProgress([
    { hours: 10, status: 'approved' },
    { hours: 1, status: 'done' },
    { hours: 9, status: 'todo' },
  ]);
  assert.equal(p.approvedHours, 10);
  assert.equal(p.totalHours, 20);
  assert.equal(p.percent, 50);
  assert.equal(p.doneHours, 11, 'done but not yet approved is shown apart');
  assert.equal(computeProgress([{ hours: 1, status: 'approved' }, { hours: 2, status: 'todo' }]).percent, 33.3, 'one decimal');
});

test('unknown hours are counted apart, never as zero, and no hours means no percentage', () => {
  const p = computeProgress([{ hours: 4, status: 'approved' }, { hours: null, status: 'approved' }, { hours: 4, status: 'todo' }]);
  assert.equal(p.percent, 50);
  assert.equal(p.unknownHoursCount, 1);
  assert.equal(p.approvedCount, 2);
  assert.equal(computeProgress([{ hours: null, status: 'todo' }]).percent, null);
  assert.equal(computeProgress([]).percent, null);
});

test('who may move a task where', () => {
  assert.equal(checkMove('todo', 'in_progress', 'freelancer'), 'started');
  assert.equal(checkMove('in_progress', 'done', 'freelancer'), 'done');
  assert.equal(checkMove('todo', 'done', 'freelancer'), 'done', 'small tasks can go straight to done');
  assert.equal(checkMove('done', 'approved', 'client'), 'approved');
  assert.equal(checkMove('done', 'in_progress', 'client', 'Button colour is off'), 'sent_back');
  const no = (from, to, by, note, msg) => assert.throws(() => checkMove(from, to, by, note), (e) => e instanceof MoveError && msg.test(e.message));
  no('done', 'approved', 'freelancer', undefined, /Only the client/);
  no('todo', 'in_progress', 'client', undefined, /Only the freelancer/);
  no('todo', 'approved', 'client', undefined, /cannot go from to do to approved/);
  no('approved', 'done', 'freelancer', undefined, /already approved/);
  no('done', 'in_progress', 'client', '  ', /what still needs doing/);
  no('done', 'done', 'freelancer', undefined, /already done/);
  no('todo', 'finished', 'freelancer', undefined, /Unknown status/);
});

test('days are counted in India time', () => {
  assert.equal(istDay('2026-10-18T18:29:00Z'), '2026-10-18', '11:59 pm in India');
  assert.equal(istDay('2026-10-18T18:30:00Z'), '2026-10-19', 'midnight in India');
});

test('the client is warned after 2 days without a check-in', () => {
  const start = '2026-10-15T04:00:00Z';
  assert.equal(checkinStatus([], start, '2026-10-16T10:00:00Z').warn, false, '1 day after the start');
  const two = checkinStatus([], start, '2026-10-17T10:00:00Z');
  assert.equal(two.warn, true);
  assert.equal(two.daysSince, 2);
  assert.equal(two.last, null);
  const fresh = checkinStatus(['2026-10-16', '2026-10-18'], start, '2026-10-18T12:00:00Z');
  assert.equal(fresh.checkedInToday, true);
  assert.equal(fresh.warn, false);
  assert.equal(fresh.last, '2026-10-18');
  assert.equal(checkinStatus(['2026-10-16'], start, '2026-10-19T12:00:00Z').daysSince, 3);
  assert.equal(checkinStatus([], start, '2026-10-30T12:00:00Z', false).warn, false, 'no warning when everything is approved');
});
