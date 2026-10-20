'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { START_CREDITS, PACKS, CreditError, balanceOf, canCall, chargeCall, buyPack } = require('./credits.js');

test('a client starts with 10 credits, also an account from before credits existed', () => {
  assert.equal(START_CREDITS, 10);
  assert.equal(balanceOf(undefined), 10);
  assert.equal(balanceOf(null), 10);
  assert.equal(balanceOf(3), 3);
  assert.equal(balanceOf(0), 0, 'zero is zero, not the starting amount');
});

test('each call costs 1 credit: after one call 9 are left', () => {
  assert.equal(chargeCall(undefined), 9);
  let b = 10;
  for (let i = 0; i < 10; i += 1) b = chargeCall(b);
  assert.equal(b, 0);
});

test('with no credits left a call is refused', () => {
  assert.equal(canCall(0), false);
  assert.equal(canCall(1), true);
  assert.throws(() => chargeCall(0), (e) => e instanceof CreditError && /Buy credits/.test(e.message));
});

test('buying a pack adds its credits; an unknown pack is refused', () => {
  const p = PACKS[0];
  const r = buyPack(0, p.id);
  assert.equal(r.balance, p.credits);
  assert.equal(r.pack.price, p.price);
  assert.equal(buyPack(undefined, p.id).balance, 10 + p.credits);
  assert.throws(() => buyPack(5, 'nope'), CreditError);
  assert.ok(PACKS.every((x) => Number.isInteger(x.credits) && x.credits > 0 && Number.isInteger(x.price) && x.price > 0));
});
