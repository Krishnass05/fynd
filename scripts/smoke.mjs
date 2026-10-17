// End-to-end smoke test of the API. Usage: start the app (npm run dev or npm start), then: npm run smoke
// Uses the in-memory store and resets it first. OWNER: Krishna.
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const call = async (method, path, user, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-demo-user': user ?? '' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
};
const ok = async (...a) => {
  const r = await call(...a);
  assert.equal(r.status, 200, `${a[0]} ${a[1]} -> ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
};

const CLIENT = 'u_client1';
const FREE = 'u_freelancer2';

await ok('POST', '/api/reset');

// hiring: post, apply, accept
const job = await ok('POST', '/api/jobs', CLIENT, { title: 'Shop website', description: 'A small shop website with a contact form.', budget: 15000, deadline: '2026-12-01' });
assert.equal(job.status, 'open');
assert.equal((await call('POST', '/api/jobs', FREE, { title: 'x', description: 'y', budget: 1, deadline: '2026-12-01' })).status, 403, 'freelancer cannot post a job');
const app = await ok('POST', `/api/jobs/${job.id}/applications`, FREE, { pitch: 'I can do this.', proposedPrice: 14000 });
assert.equal((await call('POST', `/api/jobs/${job.id}/applications`, FREE, { pitch: 'again', proposedPrice: 1 })).status, 409, 'cannot apply twice');
assert.equal((await call('POST', `/api/applications/${app.id}/accept`, FREE)).status, 403, 'freelancer cannot accept');
const { projectId } = await ok('POST', `/api/applications/${app.id}/accept`, CLIENT);
assert.equal((await call('POST', `/api/applications/${app.id}/accept`, CLIENT)).status, 409, 'cannot accept twice');

// chat
await ok('POST', `/api/projects/${projectId}/messages`, FREE, { body: 'Hello, ready to start.' });
assert.equal((await ok('GET', `/api/projects/${projectId}/messages`, CLIENT)).length, 1);

// signed SOW then amendment
const baseline = ['Rate: Rs 1000/hr', '', 'Deliverables', '- One landing page', '- Contact form', '', 'Excluded', '- Payment checkout', '- Blog'].join('\n');
const up1 = await ok('POST', `/api/projects/${projectId}/sow`, FREE, { kind: 'baseline', filename: 'signed.txt', text: baseline });
assert.equal(up1.compare, null);
assert.equal((await call('POST', `/api/projects/${projectId}/sow`, FREE, { kind: 'baseline', filename: 'again.txt', text: baseline + '\n- extra' })).status, 409, 'only one signed SOW');

const amend = ['Deliverables', '- One landing page', '- Contact form', '- Payment checkout (6 hours)', '- Loyalty points page (4 hours)', '- Newsletter signup'].join('\n');
assert.equal((await call('POST', `/api/projects/${projectId}/sow`, FREE, { kind: 'amendment', filename: 'v2.txt', text: amend })).status, 403, 'only the client uploads an amendment');
const up2 = await ok('POST', `/api/projects/${projectId}/sow`, CLIENT, { kind: 'amendment', filename: 'v2.txt', text: amend });
const labels = Object.fromEntries(up2.compare.items.map((i) => [i.text, i.label]));
assert.equal(labels['Payment checkout'], 'previously_excluded');
assert.equal(labels['Loyalty points page'], 'new');
assert.equal(labels['One landing page'], 'unchanged');

const checkout = up2.project.changeRequests.find((c) => c.text === 'Payment checkout');
assert.equal(checkout.estimate.amount, 6000, 'check 1: 6 hours at 1000 is 6000 before tax');
assert.ok(checkout.flags.some((f) => f.code === 'previously_excluded'));
const newsletter = up2.project.changeRequests.find((c) => c.text === 'Newsletter signup');
assert.equal(newsletter.estimate, null, 'unknown hours are not priced');
assert.ok(newsletter.flags.some((f) => f.code === 'hours_unknown'));

// check 2: rejected change is not committed
assert.equal((await call('POST', `/api/projects/${projectId}/changes/${checkout.id}/approve`, FREE)).status, 403, 'freelancer cannot approve');
const rejected = await ok('POST', `/api/projects/${projectId}/changes/${checkout.id}/reject`, CLIENT, { reason: 'too costly' });
assert.equal(rejected.totals.committedValue, 0);
assert.equal((await call('POST', `/api/projects/${projectId}/changes/${checkout.id}/approve`, CLIENT)).status, 409, 'rejected cannot be approved');
const reopened = await ok('POST', `/api/projects/${projectId}/changes/${checkout.id}/reopen`, FREE, { reason: 'client agreed to revisit' });
assert.equal(reopened.changeRequests.find((c) => c.id === checkout.id).state, 'quoted');
const approved = await ok('POST', `/api/projects/${projectId}/changes/${checkout.id}/approve`, CLIENT);
assert.equal(approved.totals.committedValue, 6000);

// check 3: same amendment again does not double-charge or double-book
const again = await ok('POST', `/api/projects/${projectId}/sow`, CLIENT, { kind: 'amendment', filename: 'v2-again.txt', text: amend });
assert.equal(again.project.totals.committedValue, 6000);
assert.equal(again.project.sowDocuments.length, 2, 'same text does not create a new SOW version');
assert.equal(again.project.changeRequests.length, up2.project.changeRequests.length);

// bad input gives clear messages, not crashes
assert.equal((await call('POST', '/api/jobs', CLIENT, { title: 'x', description: 'y', budget: -5, deadline: '2026-12-01' })).status, 400);
assert.equal((await call('POST', `/api/projects/${projectId}/sow`, CLIENT, { kind: 'amendment', filename: 'bad.exe', text: 'x' })).status, 400);
assert.equal((await call('POST', `/api/projects/${projectId}/sow`, CLIENT, { kind: 'amendment', filename: 'empty.txt', text: 'nothing useful here' })).status, 400);
assert.equal((await call('GET', '/api/me', '')).status, 403);
const demo = await ok('GET', '/api/demo');
assert.equal(demo.allPassed, true);

console.log('smoke test passed');
