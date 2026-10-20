// Checks the Supabase storage layer against a pretend Supabase (no real project needed).
//   1) node scripts/supabase-mock.cjs
//   2) SUPABASE_URL=http://localhost:4030 SUPABASE_SERVICE_ROLE_KEY=test-service-key SESSION_SECRET=test npm run dev
//   3) node scripts/supabase-check.mjs write      (writes data, runs a call, fires parallel writes)
//   4) stop and start the app again with the same settings (the "restart"), then
//   5) node scripts/supabase-check.mjs read       (the data and the account must still be there)
import assert from 'node:assert/strict';

const B = process.env.BASE_URL ?? 'http://localhost:3000';
const MOCK = 'http://localhost:4030';
const mode = process.argv[2] ?? 'write';
const state = async () => (await fetch(MOCK + '/_state')).json();
const api = async (method, path, { user, cookie, body } = {}) => {
  const res = await fetch(B + path, { method, headers: { 'content-type': 'application/json', ...(user ? { 'x-demo-user': user } : {}), ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const set = res.headers.getSetCookie?.() ?? [];
  const sess = set.find((c) => c.startsWith('cd_session='));
  return { status: res.status, data: await res.json(), cookie: sess ? sess.split(';')[0] : null };
};
const reg = { name: 'Persist Person', email: 'persist.person@example.com', password: 'Sunrise42xyz', confirmPassword: 'Sunrise42xyz', accountType: 'client', acceptedTerms: true };

if (mode === 'write') {
  // 1. the first request puts the demo data in the database
  assert.equal((await api('GET', '/api/stats')).status, 200);
  const s0 = await state();
  assert.equal(s0.hasData, true, 'the demo data was saved to the database on first use');
  assert.ok(s0.users >= 8);
  const v0 = s0.version;

  // 2. reads do not write
  for (let i = 0; i < 5; i += 1) await api('GET', '/api/freelancers', { user: 'u_client1' });
  assert.equal((await state()).version, v0, 'reading does not change the stored version');

  // 3. a write is saved, and a failed one is not
  const made = await api('POST', '/api/auth/register', { body: reg });
  assert.equal(made.status, 200);
  const s1 = await state();
  assert.ok(s1.version > v0, 'registering saved a new version');
  assert.equal(s1.users, s0.users + 1);
  const dataText = JSON.stringify(await (await fetch(MOCK + '/_data')).json());
  assert.ok(!dataText.includes('Sunrise42xyz'), 'the plain password is not stored');
  assert.ok(dataText.includes('scrypt$'), 'only a salted hash is stored');
  const before = (await state()).version;
  assert.equal((await api('POST', '/api/auth/register', { body: { ...reg, email: 'bad' } })).status, 400);
  assert.equal((await state()).version, before, 'a refused request writes nothing');

  // 4. the account works from its cookie on a fresh request
  const me = await api('GET', '/api/me', { cookie: made.cookie });
  assert.equal(me.data.email, 'persist.person@example.com');
  const job = await api('POST', '/api/jobs', { cookie: made.cookie, user: made.data.id, body: { title: 'Persist job', description: 'A job that must survive a restart.', budget: 5000, deadline: '2026-12-01' } });
  assert.equal(job.status, 200);
  console.log('job id', job.data.id);

  // 5. many writers at once: nothing is lost, the clashes are retried
  const n = 14;
  const sent = await Promise.all(Array.from({ length: n }, (_, i) => api('POST', '/api/projects/P1/messages', { user: i % 2 ? 'u_client1' : 'u_freelancer1', body: { body: `parallel message ${i}` } })));
  assert.ok(sent.every((r) => r.status === 200), 'every parallel write succeeded: ' + sent.map((r) => r.status).join(','));
  const log = await api('GET', '/api/projects/P1/messages', { user: 'u_client1' });
  for (let i = 0; i < n; i += 1) assert.ok(log.data.some((m) => m.body === `parallel message ${i}`), 'message ' + i + ' was not lost');
  const st = await state();
  assert.ok(st.conflicts > 0, 'the parallel writes really did clash and were retried (conflicts: ' + st.conflicts + ')');
  console.log('parallel writes:', n, 'conflicts retried:', st.conflicts);

  // 6. a call across "servers": signals go through their own table
  await api('POST', '/api/projects/P1/call', { user: 'u_client1', body: { mode: 'voice' } });
  const rung = await api('GET', '/api/projects/P1/call/signals?since=0', { user: 'u_freelancer1' });
  assert.ok(rung.data.some((x) => x.type === 'ring'), 'the ring arrives');
  const sBefore = await state();
  assert.equal(sBefore.signals >= 1, true, 'signals are in their own table');
  const vBeforeCall = (await state()).version;
  const cut = await api('POST', '/api/projects/P1/call/caption', { user: 'u_freelancer1', body: { text: 'my number is nine eight seven six five four three two one zero' } });
  assert.equal(cut.data.blocked, true, 'the guard still ends the call');
  const hang = await api('GET', '/api/projects/P1/call/signals?since=0', { user: 'u_client1' });
  assert.ok(hang.data.some((x) => x.type === 'hangup'));
  assert.ok((await state()).version > vBeforeCall, 'only the chat note was a state write');
  const clean = await api('POST', '/api/projects/P1/call/caption', { user: 'u_freelancer1', body: { text: 'the milestone looks good' } });
  assert.equal(clean.data.blocked, false);
  const vAfterClean = (await state()).version;
  await api('POST', '/api/projects/P1/call/caption', { user: 'u_freelancer1', body: { text: 'another clean line' } });
  assert.equal((await state()).version, vAfterClean, 'captions do not rewrite the whole state');

  // 7. a wrong key is refused by the database (the app must not fall over silently)
  console.log('WRITE PHASE OK. Now restart the app with the same settings and run: node scripts/supabase-check.mjs read');
} else {
  // after a restart, everything is still there
  const st = await state();
  assert.equal(st.hasData, true);
  const login = await api('POST', '/api/login', { body: { email: 'persist.person@example.com', password: 'Sunrise42xyz', role: 'client' } });
  assert.equal(login.status, 200, 'the registered account survived the restart');
  assert.ok(login.cookie, 'and can log in with its password');
  const jobs = await api('GET', '/api/jobs?mine=1', { cookie: login.cookie, user: login.data.id });
  assert.ok(jobs.data.some((j) => j.title === 'Persist job'), 'the job survived the restart');
  const log = await api('GET', '/api/projects/P1/messages', { user: 'u_client1' });
  assert.ok(log.data.filter((m) => /^parallel message/.test(m.body)).length === 14, 'all 14 parallel messages survived');
  assert.ok((await api('GET', '/api/projects/P1', { user: 'u_client1' })).data.changeRequests.length >= 1, 'the project and its change orders survived');
  const dash = await api('GET', '/api/client-dashboard', { user: 'u_client1' });
  assert.equal(dash.status, 200);
  console.log('READ PHASE OK: data survived the restart');
}
