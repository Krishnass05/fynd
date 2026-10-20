'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { review, status, config, parseVerdict } = require('./aiguard.js');

const GEMINI = { GEMINI_API_KEY: 'test-key' };
const reply = (text, ok = true) => async () => ({ ok, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) });
const claudeReply = (text) => async () => ({ ok: true, json: async () => ({ content: [{ text }] }) });

test('it is off without a key, and with AI_GUARD_PROVIDER=off', async () => {
  assert.equal(config({}), null);
  assert.deepEqual(status({}), { enabled: false, provider: null });
  assert.equal(await review('call me on my special number', { env: {}, fetchImpl: () => { throw new Error('must not be called'); } }), null);
  assert.equal(config({ ...GEMINI, AI_GUARD_PROVIDER: 'off' }), null);
});

test('the provider comes from whichever key is set', () => {
  assert.equal(config(GEMINI).provider, 'gemini');
  assert.equal(config({ ANTHROPIC_API_KEY: 'k' }).provider, 'anthropic');
  assert.equal(config({ ...GEMINI, ANTHROPIC_API_KEY: 'k' }).provider, 'gemini', 'the free one wins when both are set');
  assert.equal(config({ ...GEMINI, ANTHROPIC_API_KEY: 'k', AI_GUARD_PROVIDER: 'anthropic' }).provider, 'anthropic');
  assert.deepEqual(status(GEMINI), { enabled: true, provider: 'gemini' });
});

test('a flagged message is returned with its reasons', async () => {
  const v = await review('my number is the year india got independence then the pin code of hyderabad', {
    env: GEMINI, fetchImpl: reply('{"share_contact": true, "reasons": ["a phone number given as a riddle"]}'),
  });
  assert.equal(v.flag, true);
  assert.deepEqual(v.reasons, ['a phone number given as a riddle']);
  assert.equal(v.provider, 'gemini');
});

test('a safe message comes back as not flagged', async () => {
  const v = await review('The extra work is six hours at one thousand rupees', { env: GEMINI, fetchImpl: reply('{"share_contact": false, "reasons": []}') });
  assert.equal(v.flag, false);
  assert.deepEqual(v.reasons, []);
});

test('the request is built correctly for Gemini and for Claude, and the key is sent as a header, not in the address', async () => {
  let seen;
  await review('please text me tomorrow okay', { env: GEMINI, fetchImpl: async (url, init) => { seen = { url, init }; return reply('{"share_contact": false}')(); } });
  assert.match(seen.url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-[\w.-]+:generateContent$/);
  assert.ok(!seen.url.includes('test-key'), 'the key must not be in the URL');
  assert.equal(seen.init.headers['x-goog-api-key'], 'test-key');
  const body = JSON.parse(seen.init.body);
  assert.equal(body.generationConfig.temperature, 0);
  assert.match(body.systemInstruction.parts[0].text, /untrusted/);
  assert.equal(JSON.parse(body.contents[0].parts[0].text).text, 'please text me tomorrow okay');

  let seen2;
  const v = await review('please text me tomorrow okay', { env: { ANTHROPIC_API_KEY: 'k2' }, fetchImpl: async (url, init) => { seen2 = { url, init }; return claudeReply('{"share_contact": true, "reasons": ["moving off platform"]}')(); } });
  assert.equal(seen2.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(seen2.init.headers['x-api-key'], 'k2');
  assert.equal(JSON.parse(seen2.init.body).model, 'claude-haiku-5-5');
  assert.equal(v.flag, true);
});

test('every failure falls back to null, so the rules decide alone', async () => {
  const o = { env: GEMINI };
  assert.equal(await review('call me on my other phone', { ...o, fetchImpl: reply('{}', false) }), null, 'HTTP error or rate limit');
  assert.equal(await review('call me on my other phone', { ...o, fetchImpl: async () => { throw new Error('network down'); } }), null, 'network error');
  assert.equal(await review('call me on my other phone', { ...o, fetchImpl: reply('I think this is fine') }), null, 'not JSON');
  assert.equal(await review('call me on my other phone', { ...o, fetchImpl: reply('{"share_contact": "no"}') }), null, 'wrong type');
  assert.equal(await review('call me on my other phone', { ...o, fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }), null, 'empty answer');
});

test('a slow model is cut off', async () => {
  const slow = (url, init) => new Promise((_, reject) => { init.signal.addEventListener('abort', () => reject(new Error('aborted'))); });
  const t0 = Date.now();
  assert.equal(await review('call me on my other phone', { env: GEMINI, fetchImpl: slow, timeoutMs: 80 }), null);
  assert.ok(Date.now() - t0 < 1000);
});

test('very short text is not sent, and long text is cut', async () => {
  let calls = 0; let sent = '';
  const f = async (u, init) => { calls += 1; sent = init.body; return reply('{"share_contact": false}')(); };
  assert.equal(await review('ok', { env: GEMINI, fetchImpl: f }), null);
  assert.equal(calls, 0);
  await review('x'.repeat(5000), { env: GEMINI, fetchImpl: f });
  assert.equal(calls, 1);
  assert.ok(sent.length < 3000);
});

test('parseVerdict never turns junk into "safe"', () => {
  assert.equal(parseVerdict(undefined), null);
  assert.equal(parseVerdict('safe'), null);
  assert.equal(parseVerdict('{"share_contact": 1}'), null);
  assert.deepEqual(parseVerdict('```json\n{"share_contact": true}\n```'), { flag: true, reasons: ['possible contact details'] });
  assert.deepEqual(parseVerdict('{"share_contact": false, "reasons": ["x"]}'), { flag: false, reasons: [] });
});
