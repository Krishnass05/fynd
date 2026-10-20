// End-to-end check of "Sign in with Google" against a pretend Google (no real client id needed).
// 1) node scripts/google-mock.cjs
// 2) GOOGLE_CLIENT_ID=test-id GOOGLE_CLIENT_SECRET=test-secret GOOGLE_AUTH_URL=http://localhost:4020/auth \
//    GOOGLE_TOKEN_URL=http://localhost:4020/token GOOGLE_USERINFO_URL=http://localhost:4020/userinfo npm run dev
// 3) npm run google:check
import assert from 'node:assert/strict';

const B = process.env.BASE_URL ?? 'http://localhost:3000';
const go = async (path, cookie) => {
  const res = await fetch(B + path, { redirect: 'manual', headers: cookie ? { cookie } : {} });
  const set = res.headers.getSetCookie();
  const pick = (n) => { const c = set.find((x) => x.startsWith(n + '=')); return c ? c.split(';')[0] : null; };
  return { status: res.status, to: res.headers.get('location') ?? '', oauth: pick('cd_oauth'), session: pick('cd_session'), set };
};
const j = async (path, cookie) => { const r = await fetch(B + path, { headers: cookie ? { cookie } : {} }); return { status: r.status, data: await r.json() }; };
const post = async (path, body) => {
  const r = await fetch(B + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, data: await r.json() };
};
// the signed state the server hands out, to put back in the return trip
const start = async (qs) => {
  const s = await go('/api/auth/google/start?' + qs);
  assert.equal(s.status, 307, 'start redirects to Google');
  const url = new URL(s.to);
  return { s, state: url.searchParams.get('state'), url, cookie: s.oauth };
};

await fetch(B + '/api/reset', { method: 'POST' });
assert.equal((await j('/api/auth/config')).data.google, true, 'Google is switched on in this server (see the steps at the top)');

// 1. the way out: goes to Google with the right asks, and a signed note is kept
const a = await start('mode=register&type=freelancer');
assert.equal(a.url.origin + a.url.pathname, 'http://localhost:4020/auth');
assert.equal(a.url.searchParams.get('client_id'), 'test-id');
assert.equal(a.url.searchParams.get('response_type'), 'code');
assert.match(a.url.searchParams.get('scope'), /openid email profile/);
assert.match(a.url.searchParams.get('redirect_uri'), /\/api\/auth\/google\/callback$/);
assert.ok(a.state && a.state.length >= 16 && a.cookie, 'a random state, and a cookie that holds it');
assert.ok(!a.s.set.join(' ').includes('test-secret'), 'the secret is never sent to the browser');

// 2. a new person comes back from Google: an account for the side they chose, signed in, email already verified
const back = await go(`/api/auth/google/callback?code=good-new&state=${a.state}`, a.cookie);
assert.equal(back.status, 307);
assert.match(back.to, /\/auth\/done\?role=freelancer/);
assert.ok(back.session, 'signed in with a session cookie');
const me = await j('/api/me', back.session);
assert.equal(me.data.email, 'new.person@gmail.com');
assert.equal(me.data.role, 'freelancer');
assert.equal(me.data.name, 'New Person');
assert.equal(me.data.emailVerified, true, 'Google verified the address');
assert.ok(!JSON.stringify(me.data).match(/token|secret|password/i));

// 3. coming back again signs in to the same account instead of making another
const b = await start('mode=login&type=client');
const again = await go(`/api/auth/google/callback?code=good-new-2&state=${b.state}`, b.cookie);
assert.equal(again.status, 307);
assert.match(again.to, /\/auth\/done/);
assert.equal((await j('/api/me', again.session)).data.id, me.data.id, 'the same account');

// 4. an account made with a password, then Google with the same verified email: it joins the same account
const made = await post('/api/auth/register', { name: 'Existing User', email: 'existing.user@example.com', password: 'Sunrise42', confirmPassword: 'Sunrise42', accountType: 'client', acceptedTerms: true });
assert.equal(made.status, 200);
const c = await start('mode=login&type=client');
const joined = await go(`/api/auth/google/callback?code=good-existing&state=${c.state}`, c.cookie);
assert.ok(joined.session);
const linked = await j('/api/me', joined.session);
assert.equal(linked.data.id, made.data.id, 'Google joined the existing account');
assert.equal(linked.data.emailVerified, true);

// 5. things that must NOT sign anyone in
const d = await start('mode=login&type=client');
let r = await go('/api/auth/google/callback?code=good-new&state=WRONG-STATE', d.cookie);
assert.match(r.to, /\/login\?google=state/, 'a wrong state is refused');
assert.equal(r.session, null);
r = await go(`/api/auth/google/callback?code=good-new&state=${d.state}`);
assert.match(r.to, /google=state/, 'no cookie, no sign-in');
const e = await start('mode=register&type=client');
r = await go(`/api/auth/google/callback?code=unverified&state=${e.state}`, e.cookie);
assert.match(r.to, /\/register\?google=unverified/, 'an unverified Google email is refused');
assert.equal(r.session, null);
const f = await start('mode=login&type=client');
r = await go(`/api/auth/google/callback?code=good-new&state=${f.state}`, f.cookie);
assert.match(r.to, /google=unverified/, 'a reused code is refused');
const g = await start('mode=login&type=client');
r = await go(`/api/auth/google/callback?error=access_denied&state=${g.state}`, g.cookie);
assert.match(r.to, /google=denied/, 'cancelling at Google comes back with a clear reason');
r = await go('/api/auth/google/callback?code=x&state=y', 'cd_oauth=forged.value');
assert.match(r.to, /google=state/, 'a forged note is refused');

// 6. a plain next path is kept, an outside address is not
const h = await start('mode=login&type=client&next=' + encodeURIComponent('//evil.example'));
r = await go(`/api/auth/google/callback?code=good-next&state=${h.state}`, h.cookie);
assert.ok(!r.to.includes('evil'), 'no redirect to another site');
console.log('Google sign-in works against the pretend Google');
