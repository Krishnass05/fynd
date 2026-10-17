'use strict';
// Scripted demo of the three case outcome checks, in printed order.
// Runs on its own throwaway desk so it never touches the user's working state.

const fixture = require('./fixture.json');
const { ScopeDesk, ConflictError } = require('./scopeDesk.js');

function runDemo() {
  const steps = [];
  const add = (n, title, expected, actual, pass) => steps.push({ n, title, expected, actual, pass: !!pass });

  // 1. 6h x 1000/hr = 6000 before taxes
  const d1 = ScopeDesk.fromFixture(fixture);
  const r1 = d1.requests().find((r) => r.id === 'R1');
  add(1, 'Six extra hours at 1000/hr gives a change estimate before taxes',
    '6000 INR, before tax', `${r1.estimate.amount} ${r1.estimate.currency}, ${r1.estimate.beforeTax ? 'before tax' : 'tax included'}`,
    r1.estimate.amount === 6000 && r1.estimate.beforeTax);

  // 2. Rejected change does not become committed work
  const d2 = ScopeDesk.fromFixture(fixture);
  d2.reject('R1', 'demo', 'client declined');
  let blocked = false;
  try { d2.approve('R1', 'demo'); } catch (e) { blocked = e instanceof ConflictError; }
  d2.importRequests(fixture.requests, 'demo');
  const st = d2.requests().find((r) => r.id === 'R1').state;
  add(2, 'A rejected change does not silently become committed work',
    'state rejected, committed value 0, approve blocked, re-import does not revive it',
    `state ${st}, committed value ${d2.committedValue()}, approve ${blocked ? 'blocked' : 'ALLOWED'}`,
    st === 'rejected' && d2.committedValue() === 0 && blocked);

  // 3. Repeated import does not double-charge or double-book
  const d3 = ScopeDesk.fromFixture(fixture);
  d3.approve('R1', 'demo');
  const before = [d3.committedValue(), d3.committedHours(), d3.requests().length];
  const res = d3.importRequests(fixture.requests, 'demo');
  const after = [d3.committedValue(), d3.committedHours(), d3.requests().length];
  add(3, 'Importing the same request again does not double-charge or double-book',
    `unchanged: value ${before[0]}, hours ${before[1]}, requests ${before[2]}`,
    `value ${after[0]}, hours ${after[1]}, requests ${after[2]}, ignored ${res.ignored.length}`,
    before.join() === after.join() && res.ignored.length === 2);

  return { allPassed: steps.every((s) => s.pass), steps };
}

module.exports = { runDemo };
