'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { scrub, inspectSpeech, HIDDEN } = require('./guard.js');

const hidden = (t) => scrub(t).redacted;

test('written phone numbers are hidden, in common layouts', () => {
  for (const t of ['call 9876543210', 'call +91 98765 43210', 'call (987) 654-3210', 'call 98765-43210 now', 'aadhaar 1234 5678 9012']) {
    assert.ok(hidden(t), t);
    assert.ok(scrub(t).body.includes(HIDDEN), t);
  }
  assert.equal(scrub('call 98765 43210 today').body, `call ${HIDDEN} today`);
});

test('normal numbers are left alone: prices, hours, dates, counts', () => {
  for (const t of [
    'Extra 6 hours at Rs 1000, due 2026-11-10',
    'The total is 12,000 rupees before tax',
    'I need 3 logos and 2 revision rounds by 20 November',
    'one landing page, two revision rounds, one contact form',
    'Six hours at one thousand rupees an hour',
    'Invoice 2026 1110 for 48 hours',
  ]) assert.equal(hidden(t), false, t);
});

test('a number written out in words is found', () => {
  assert.ok(hidden('my number is eight one two two nine five five zero one two'));
  assert.ok(hidden('nine eight seven six five four three two one zero'));
  assert.ok(hidden('call nine eight, seven six five, four three two one zero'));
  assert.equal(scrub('ring eight one two two nine five five zero one two please').body, `ring ${HIDDEN} please`);
});

test('words mixed with digits are found', () => {
  assert.ok(hidden('98 seven six 5 4 3 2 1 0'));
  assert.ok(hidden('nine eight 76543 two one zero'));
});

test('double, triple and tens words count as digits', () => {
  assert.ok(hidden('nine double eight double five six seven one two'));
  assert.ok(hidden('triple nine eight seven six five four three'));
  assert.ok(hidden('ninety eight seventy six fifty four thirty two ten'));
});

test('Hindi digit words are found', () => {
  assert.ok(hidden('mera number hai nau aath saat chhe paanch char teen do ek shunya'));
});

test('email addresses are hidden: written, spoken, and with "at the rate"', () => {
  assert.equal(scrub('mail owner@shop.in please').body, `mail ${HIDDEN} please`);
  assert.ok(hidden('write to priya dot k at gmail dot com'));
  assert.ok(hidden('it is priya at gmail dot com'));
  assert.ok(hidden('priya at the rate gmail dot com'));
  assert.ok(hidden('priya at the rate of yahoo dot co dot in'));
  assert.deepEqual(scrub('owner@shop.in').kinds, ['email address']);
});

test('payment ids, links, handles and PAN are hidden', () => {
  assert.ok(hidden('pay to priya@okaxis'));
  assert.ok(hidden('see www.myportfolio.com/work'));
  assert.ok(hidden('visit https://example.org/me'));
  assert.ok(hidden('find me on instagram @priya_designs'));
  assert.ok(hidden('telegram: priya_k'));
  assert.ok(hidden('PAN is ABCDE1234F'));
});

test('ordinary sentences are not hidden', () => {
  for (const t of [
    'Can you share the files on this platform?',
    'The payment checkout is excluded, so it is a change order.',
    'I can start Monday and deliver in two weeks.',
    'We met at the office at nine.',
    'Please approve milestone two and three.',
    'The site uses a .com domain.',
  ]) assert.equal(hidden(t), false, t);
});

test('asking to move off the platform is flagged but not hidden', () => {
  for (const t of ['call me tomorrow', 'what is your number', 'ping me on whatsapp', 'email me the files']) {
    const r = scrub(t);
    assert.equal(r.asksOffPlatform, true, t);
    assert.equal(r.redacted, false, t);
  }
  assert.equal(scrub('I will call the client tomorrow').asksOffPlatform, false);
});

test('calls: spoken details end the call, and the saved caption is safe', () => {
  const a = inspectSpeech('sure, my number is nine eight seven six five four three two one zero');
  assert.equal(a.block, true);
  assert.ok(a.reasons.includes('phone number (said in words)'));
  assert.ok(!/nine|eight/.test(a.safeText), a.safeText);
  assert.equal(inspectSpeech('write to me at priya at gmail dot com').block, true);
  assert.equal(inspectSpeech('can you whatsapp me').block, true);
  const ok = inspectSpeech('The extra work is six hours at one thousand rupees, before tax.');
  assert.equal(ok.block, false);
  assert.equal(ok.safeText, 'The extra work is six hours at one thousand rupees, before tax.');
});

test('empty or odd input does not crash', () => {
  for (const t of ['', '   ', '!!!', '0', '😀 98765', 'a'.repeat(5000)]) assert.doesNotThrow(() => scrub(t));
  assert.equal(scrub('').redacted, false);
});
