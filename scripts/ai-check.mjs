// End-to-end check of the AI second check against a pretend Gemini server (no real key or internet needed).
// 1) node scripts/ai-mock-gemini.cjs   2) AI_GUARD_PROVIDER=gemini GEMINI_API_KEY=test AI_GUARD_BASE_URL=http://localhost:4010 npm run dev   3) npm run ai:check
import assert from 'node:assert/strict';
const B = 'http://localhost:3000';
const c = async (m, p, u, body) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', 'x-demo-user': u ?? '' }, body: body && JSON.stringify(body) }); return { s: r.status, d: await r.json() }; };
const hits = async () => Number(await (await fetch('http://localhost:4010/hits')).text());

await c('POST', '/api/reset');
assert.deepEqual((await c('GET', '/api/ai-status')).d, { enabled: true, provider: 'gemini' });

const h0 = await hits();
// 1. the rules cannot see this riddle; the (pretend) model can
const riddle = 'my number is the year india got independence followed by the pin code of hyderabad';
const m = (await c('POST', '/api/projects/P1/messages', 'u_freelancer1', { body: riddle })).d;
assert.equal(m.redacted, true, 'the AI flagged it');
assert.ok(!/independence|pin code/.test(m.body), 'the riddle is not saved: ' + m.body);
assert.match(m.hiddenKinds[0], /^AI check: /);
console.log('chat riddle hidden:', m.body, '|', m.hiddenKinds[0]);

// 2. normal talk is untouched
const ok = (await c('POST', '/api/projects/P1/messages', 'u_client1', { body: 'Please send the logo files by Friday, six hours at one thousand rupees.' })).d;
assert.equal(ok.redacted, undefined);
assert.match(ok.body, /logo files/);

// 3. a rule hit does not need the model at all
const before = await hits();
const rule = (await c('POST', '/api/projects/P1/messages', 'u_client1', { body: 'mail me at owner@shop.in' })).d;
assert.equal(rule.redacted, true);
assert.equal(await hits(), before, 'rules decided; the model was not asked');

// 4. a caption the rules pass but the model flags ends the call
await c('POST', '/api/projects/P1/call', 'u_client1', { mode: 'voice' });
const clean = (await c('POST', '/api/projects/P1/call/caption', 'u_freelancer1', { text: 'The second milestone looks good to me.' })).d;
assert.equal(clean.blocked, false);
const cut = (await c('POST', '/api/projects/P1/call/caption', 'u_freelancer1', { text: 'my riddle number is independence year then the pin code' })).d;
assert.equal(cut.blocked, true);
assert.match(cut.reasons[0], /^AI check/);
const sigs = (await c('GET', '/api/projects/P1/call/signals?since=0', 'u_client1')).d;
assert.ok(sigs.some((x) => x.type === 'hangup' && JSON.parse(x.payload).reason === 'guard'));
assert.ok(!sigs.some((x) => x.type === 'caption' && /riddle/.test(x.payload)), 'the flagged line was never passed on');
console.log('call caption ended by the AI check:', cut.reasons[0]);

assert.ok((await hits()) > h0, 'the model was asked');
console.log('AI second check works with the pretend server');
