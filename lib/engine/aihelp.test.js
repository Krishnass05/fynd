'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ask, systemPrompt } = require('./aihelp.js');
const { GUIDE } = require('./helpbot.js');

const ENV = { GEMINI_API_KEY: 'test-key' };
const ok = (text) => async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) });

test('the model is told to use only the guide, and gets the whole guide', () => {
  const s = systemPrompt('client');
  assert.match(s, /ONLY using the GUIDE/);
  assert.match(s, /untrusted/);
  assert.match(s, /ONLY the client .*uploads the amended SOW/);
  assert.match(s, /ONLY the freelancer .*uploads the signed SOW/);
  assert.match(s, /a client/);
  for (const e of GUIDE) assert.ok(s.includes(e.title), e.id);
  assert.match(systemPrompt('freelancer'), /a freelancer/);
  assert.match(systemPrompt(undefined), /not signed in/);
});

test('it is off without a key', async () => {
  assert.equal(await ask('how do I post a job?', 'client', { env: {}, fetchImpl: () => { throw new Error('must not be called'); } }), null);
});

test('a good reply is returned, with markdown stripped', async () => {
  const r = await ask('how do I post a job?', 'client', { env: ENV, fetchImpl: ok('Open the **Jobs** menu and choose `Post a job`. It has three steps.') });
  assert.equal(r, 'Open the Jobs menu and choose Post a job. It has three steps.');
});

test('the question goes in as the user message and the guide as the system message, key in a header', async () => {
  let seen;
  await ask('is there escrow?', 'client', { env: ENV, fetchImpl: async (url, init) => { seen = { url, init }; return ok('There is no escrow on this site.')(); } });
  const body = JSON.parse(seen.init.body);
  assert.equal(body.contents[0].parts[0].text, 'is there escrow?');
  assert.match(body.systemInstruction.parts[0].text, /GUIDE:/);
  assert.equal(seen.init.headers['x-goog-api-key'], 'test-key');
  assert.ok(!seen.url.includes('test-key'));
});

test('every failure gives null so the keyword answer is used', async () => {
  const o = { env: ENV };
  assert.equal(await ask('how do I post a job?', 'client', { ...o, fetchImpl: async () => ({ ok: false, json: async () => ({}) }) }), null);
  assert.equal(await ask('how do I post a job?', 'client', { ...o, fetchImpl: async () => { throw new Error('down'); } }), null);
  assert.equal(await ask('how do I post a job?', 'client', { ...o, fetchImpl: ok('') }), null);
  assert.equal(await ask('how do I post a job?', 'client', { ...o, fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }), null);
  assert.equal(await ask('   ', 'client', { ...o, fetchImpl: ok('fine reply here') }), null);
});

test('a slow model is cut off, and a very long reply is trimmed', async () => {
  const slow = (u, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  assert.equal(await ask('how do I post a job?', 'client', { env: ENV, fetchImpl: slow, timeoutMs: 60 }), null);
  const long = await ask('how do I post a job?', 'client', { env: ENV, fetchImpl: ok('word '.repeat(1000)) });
  assert.ok(long.length <= 900);
});
