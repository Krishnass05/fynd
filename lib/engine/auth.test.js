'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const v = require('./validate.js');
const a = require('./authcore.js');

test('email: good ones pass, bad ones say why', () => {
  for (const e of ['a@b.co', 'priya.k@gmail.com', 'Priya+work@Example.IN', '  spaced@mail.com  ']) assert.equal(v.validateEmail(e), '', e);
  assert.equal(v.normalizeEmail('  Priya@Gmail.COM '), 'priya@gmail.com');
  assert.match(v.validateEmail(''), /Enter your email/);
  for (const e of ['plain', 'a@b', '@b.com', 'a@.com', 'a b@c.com', 'a@@b.com', 'a..b@c.com', '.a@b.com', 'a@b.c']) assert.match(v.validateEmail(e), /does not look like/, e);
  assert.match(v.validateEmail('a'.repeat(250) + '@b.com'), /too long/);
});

test('name: letters, spaces, dots, apostrophes and hyphens only', () => {
  for (const n of ['Priya', 'Mary-Jane O\'Neil', 'K. Sudhir Patil', 'José Álvarez', 'राहुल शर्मा']) assert.equal(v.validateName(n), '', n);
  assert.match(v.validateName(''), /Enter your name/);
  assert.match(v.validateName('A'), /at least 2/);
  assert.match(v.validateName('Bob123'), /letters/);
  assert.match(v.validateName('<script>'), /letters/);
  assert.match(v.validateName('x'.repeat(81)), /80/);
});

test('password rules', () => {
  assert.equal(v.validatePassword('Sunrise42'), '');
  assert.match(v.validatePassword(''), /Enter a password/);
  assert.match(v.validatePassword('Ab1'), /at least 8/);
  assert.match(v.validatePassword('abcdefgh'), /number/);
  assert.match(v.validatePassword('12345678'), /letter/);
  assert.match(v.validatePassword('x'.repeat(40) + '1' + 'y'.repeat(40)), /72/);
  assert.match(v.validatePassword('Password1'), /too common/);
  assert.equal(v.validatePassword('Priya2026', { name: 'Priya Rao' }), '', 'a first name alone is allowed');
  assert.match(v.validatePassword('priya123', { email: 'priya123' }), /email/);
  assert.match(v.validatePassword('Priyarao9', { name: 'Priya Rao' }), /name/);
});

test('strength meter goes up with length and variety, and common passwords stay low', () => {
  assert.equal(v.passwordStrength(''), 0);
  assert.ok(v.passwordStrength('abcd1234') <= 1);
  assert.equal(v.passwordStrength('password1'), 1);
  assert.ok(v.passwordStrength('Tr1cky-Horse-Battery') >= 3);
  assert.ok(v.passwordStrength('Tr1cky-Horse-Battery') > v.passwordStrength('abc12345'));
});

test('the sign-up form reports every problem at once, with cleaned values', () => {
  const bad = v.validateRegister({ name: '', email: 'nope', password: 'abc', confirmPassword: 'x', accountType: 'boss', acceptedTerms: false });
  assert.deepEqual(Object.keys(bad.errors).sort(), ['accountType', 'acceptedTerms', 'email', 'name', 'password'].sort());
  const mismatch = v.validateRegister({ name: 'Priya Rao', email: 'priya@mail.com', password: 'Sunrise42', confirmPassword: 'Sunrise43', accountType: 'client', acceptedTerms: true });
  assert.deepEqual(Object.keys(mismatch.errors), ['confirmPassword']);
  const good = v.validateRegister({ name: '  Priya   Rao ', email: ' Priya@Mail.COM ', password: 'Sunrise42', confirmPassword: 'Sunrise42', accountType: 'both', acceptedTerms: true });
  assert.deepEqual(good.errors, {});
  assert.equal(good.values.name, 'Priya Rao');
  assert.equal(good.values.email, 'priya@mail.com');
  assert.equal(good.values.accountType, 'both');
  assert.equal(v.validateRegister(undefined).errors.name.length > 0, true);
});

test('the log-in form checks the fields only', () => {
  assert.deepEqual(v.validateLogin({ email: 'a@b.co', password: 'x', role: 'client' }).errors, {});
  const bad = v.validateLogin({ email: 'a', password: '', role: 'admin' });
  assert.deepEqual(Object.keys(bad.errors).sort(), ['email', 'password', 'role']);
});

test('passwords are stored as salted hashes that verify only the right password', () => {
  const h = a.hashPassword('Sunrise42');
  assert.match(h, /^scrypt\$16384\$/);
  assert.ok(!h.includes('Sunrise42'));
  assert.notEqual(h, a.hashPassword('Sunrise42'), 'a fresh salt each time');
  assert.equal(a.verifyPassword('Sunrise42', h), true);
  assert.equal(a.verifyPassword('Sunrise43', h), false);
  assert.equal(a.verifyPassword('Sunrise42', 'garbage'), false);
  assert.equal(a.verifyPassword('Sunrise42', undefined), false);
  assert.equal(a.verifyPassword('anything', a.DUMMY_HASH), false);
});

test('signed sessions: valid, forged, tampered, expired', () => {
  const secret = 'test-secret';
  const t = a.sign(secret, { uid: 'u1' }, 60_000, 1000);
  assert.equal(a.verify(secret, t, 2000).uid, 'u1');
  assert.equal(a.verify('other-secret', t, 2000), null, 'wrong secret');
  assert.equal(a.verify(secret, t, 1000 + 60_001), null, 'expired');
  const [body, sig] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ uid: 'u_admin', exp: 9e15 })).toString('base64url');
  assert.equal(a.verify(secret, `${forged}.${sig}`, 2000), null, 'payload changed, signature kept');
  assert.equal(a.verify(secret, `${body}.${sig.slice(0, -2)}xx`, 2000), null, 'signature changed');
  for (const junk of [undefined, null, '', 'abc', '.', 'a.b', 'x'.repeat(5000), 42]) assert.equal(a.verify(secret, junk, 2000), null);
});

test('cookie reader finds the named cookie', () => {
  assert.equal(a.readCookie('a=1; cd_session=abc.def; b=2', 'cd_session'), 'abc.def');
  assert.equal(a.readCookie('a=1', 'cd_session'), null);
  assert.equal(a.readCookie(null, 'x'), null);
  assert.equal(a.readCookie('cd_session=a%20b', 'cd_session'), 'a b');
});

test('the limiter locks after repeated failures and frees up later', () => {
  const l = a.createLimiter({ max: 3, windowMs: 1000, lockMs: 5000 });
  assert.equal(l.check('k', 0), 0);
  l.fail('k', 1); l.fail('k', 2);
  assert.equal(l.check('k', 3), 0, 'two failures are still allowed');
  l.fail('k', 4);
  assert.ok(l.check('k', 5) > 0, 'locked after the third');
  assert.equal(l.check('other', 5), 0, 'other keys are not affected');
  assert.equal(l.check('k', 5005), 0, 'free again after the lock');
  l.fail('k', 6000); l.reset('k');
  l.fail('k', 6001); l.fail('k', 6002);
  assert.equal(l.check('k', 6003), 0, 'reset clears the count');
  const l2 = a.createLimiter({ max: 3, windowMs: 100, lockMs: 5000 });
  l2.fail('z', 0); l2.fail('z', 1); l2.fail('z', 500);
  assert.equal(l2.check('z', 501), 0, 'old failures expire');
});
