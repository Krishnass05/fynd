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

// seeded project P1 shows every milestone state
const p1 = await ok('GET', '/api/projects/P1', CLIENT);
assert.deepEqual(p1.milestones.map((m) => m.status), ['approved', 'ready', 'pending']);
assert.equal(p1.milestoneSummary.total, 12000);
assert.equal(p1.milestoneSummary.approved, 3600);

// freelancer dashboard on the seed data
const seedDash = await ok('GET', '/api/dashboard', 'u_freelancer1');
assert.equal(seedDash.stats.activeProjects, 1);
assert.equal(seedDash.projects[0].counts.awaitingClient, 1, 'seed R1 is waiting for the client');
assert.ok(seedDash.attention.some((a) => a.kind === 'awaiting_client'));
assert.equal(seedDash.stats.openJobs, 0, 'seed freelancer 1 already applied to the only open job J2');
assert.equal((await call('GET', '/api/dashboard', CLIENT)).status, 403, 'dashboard is freelancer only');

// client dashboard on the seed data
const cdash = await ok('GET', '/api/client-dashboard', CLIENT);
assert.equal(cdash.stats.activeProjects, 1);
assert.equal(cdash.stats.awaitingDecision, 1, 'seed R1 waits for the client');
assert.equal(cdash.stats.applicantsWaiting, 2, 'seed J2 has two pending applicants');
assert.ok(cdash.attention.some((a) => a.kind === 'change_orders'));
assert.ok(cdash.attention.some((a) => a.kind === 'applicants'));
assert.equal(cdash.jobs.find((j) => j.job.id === 'J2').pendingCount, 2);

// compare proposals: applicants carry skills, prices differ
const j2 = await ok('GET', '/api/jobs/J2', CLIENT);
assert.equal(j2.applications.length, 2);
assert.ok(j2.applications.every((a) => Array.isArray(a.freelancerSkills)));
assert.notEqual(j2.applications[0].proposedPrice, j2.applications[1].proposedPrice);
assert.equal((await call('GET', '/api/client-dashboard', 'u_freelancer1')).status, 403, 'client dashboard is client only');

// hiring: post, apply, accept
const job = await ok('POST', '/api/jobs', CLIENT, { title: 'Shop website', description: 'A small shop website with a contact form.', budget: 15000, deadline: '2026-12-01' });
assert.equal(job.status, 'open');
assert.equal((await call('POST', '/api/jobs', FREE, { title: 'x', description: 'y', budget: 1, deadline: '2026-12-01' })).status, 403, 'freelancer cannot post a job');
const app = await ok('POST', `/api/jobs/${job.id}/applications`, FREE, { pitch: 'I can do this.', proposedPrice: 14000 });
assert.equal((await call('POST', `/api/jobs/${job.id}/applications`, FREE, { pitch: 'again', proposedPrice: 1 })).status, 409, 'cannot apply twice');
assert.equal((await call('POST', `/api/applications/${app.id}/accept`, FREE)).status, 403, 'freelancer cannot accept');
// milestones split the agreed price (14000) and must add up exactly; a bad split changes nothing
const acceptPath = `/api/applications/${app.id}/accept`;
const badSplit = await call('POST', acceptPath, CLIENT, { milestones: [{ title: 'One', amount: 1000 }] });
assert.equal(badSplit.status, 400);
assert.match(badSplit.data.error, /add up to 1000/);
assert.equal((await call('POST', acceptPath, CLIENT, { milestones: [{ title: '', amount: 14000 }] })).status, 400, 'title required');
assert.equal((await call('POST', acceptPath, CLIENT, { milestones: [{ title: 'Half', amount: 7000.5 }, { title: 'Rest', amount: 6999.5 }] })).status, 400, 'whole rupees only');
assert.equal((await ok('GET', `/api/jobs/${job.id}`, CLIENT)).job.status, 'open', 'a bad split leaves the job open');
const { projectId } = await ok('POST', acceptPath, CLIENT, { milestones: [{ title: 'Start', amount: 4000 }, { title: 'Middle', amount: 5000 }, { title: 'Final', amount: 5000 }] });
const proj0 = await ok('GET', `/api/projects/${projectId}`, CLIENT);
assert.equal(proj0.milestones.length, 3);
assert.equal(proj0.milestoneSummary.total, 14000);
assert.equal(proj0.milestoneSummary.approved, 0);
const [m1, m2] = proj0.milestones;
assert.equal((await call('POST', `/api/projects/${projectId}/milestones/${m1.id}/approve`, FREE)).status, 403, 'freelancer cannot approve a milestone');
assert.equal((await call('POST', `/api/projects/${projectId}/milestones/${m1.id}/ready`, CLIENT)).status, 403, 'client cannot mark ready');
const ready = await ok('POST', `/api/projects/${projectId}/milestones/${m1.id}/ready`, FREE);
assert.equal(ready.milestones[0].status, 'ready');
assert.equal((await call('POST', `/api/projects/${projectId}/milestones/${m1.id}/ready`, FREE)).status, 409, 'cannot mark ready twice');
const apprM = await ok('POST', `/api/projects/${projectId}/milestones/${m1.id}/approve`, CLIENT);
assert.equal(apprM.milestoneSummary.approved, 4000);
assert.equal(apprM.milestoneSummary.remaining, 10000);
assert.equal((await call('POST', `/api/projects/${projectId}/milestones/${m1.id}/approve`, CLIENT)).status, 409, 'cannot approve twice');
const direct = await ok('POST', `/api/projects/${projectId}/milestones/${m2.id}/approve`, CLIENT);
assert.equal(direct.milestoneSummary.approved, 9000, 'client may approve without a ready mark');
assert.equal((await call('POST', `/api/projects/${projectId}/milestones/NOPE/approve`, CLIENT)).status, 404);
assert.equal((await call('POST', `/api/projects/${projectId}/milestones/${m1.id}/bogus`, CLIENT)).status, 400);
assert.equal((await call('POST', `/api/applications/${app.id}/accept`, CLIENT)).status, 409, 'cannot accept twice');
const dash1 = await ok('GET', '/api/dashboard', FREE);
assert.ok(dash1.attention.some((a) => a.kind === 'upload_sow' && a.projectId === projectId), 'asked to upload the signed SOW');
assert.equal(dash1.applications.find((a) => a.id === app.id).status, 'accepted');
assert.equal(dash1.applications.find((a) => a.id === app.id).jobTitle, 'Shop website');

// chat
await ok('POST', `/api/projects/${projectId}/messages`, FREE, { body: 'Hello, ready to start.' });
assert.equal((await ok('GET', `/api/projects/${projectId}/messages`, CLIENT)).length, 1);

// signed SOW then amendment
const baseline = ['Rate: Rs 1000/hr', '', 'Deliverables', '- One landing page', '- Contact form', '', 'Excluded', '- Payment checkout', '- Blog'].join('\n');
const up1 = await ok('POST', `/api/projects/${projectId}/sow`, FREE, { kind: 'baseline', filename: 'signed.txt', text: baseline });
assert.equal(up1.compare, null);
assert.ok(!(await ok('GET', '/api/dashboard', FREE)).attention.some((a) => a.kind === 'upload_sow'), 'no SOW prompt once uploaded');
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
const dash2 = await ok('GET', '/api/dashboard', FREE);
assert.equal(dash2.stats.approvedValue, 6000);
assert.equal(dash2.projects[0].counts.approved, 1);

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

// SOW library: a job started from a profile carries the profile rate and hours into the project
const lib = await ok('GET', '/api/library', CLIENT);
assert.ok(lib.profiles.length >= 20, 'library has the team profiles');
const php = lib.profiles.find((p) => p.id === 'php-development');
assert.equal(php.ratePerHour, 1200);
const pjob = await ok('POST', '/api/jobs', CLIENT, { title: 'PHP backend', description: 'Backend modules for a small shop.', budget: 48000, deadline: '2026-12-01', profileId: 'php-development' });
assert.equal(pjob.category, php.category);
assert.equal((await call('POST', '/api/jobs', CLIENT, { title: 'x', description: 'y', budget: 1, deadline: '2026-12-01', profileId: 'no-such-profile' })).status, 400, 'unknown profile refused');
assert.equal((await call('POST', `/api/jobs/${pjob.id}/applications`, FREE, { pitch: 'x', proposedPrice: 46000.5 })).status, 400, 'price must be whole rupees');
const papp = await ok('POST', `/api/jobs/${pjob.id}/applications`, FREE, { pitch: 'Can do.', proposedPrice: 46000 });
const { projectId: pid2 } = await ok('POST', `/api/applications/${papp.id}/accept`, CLIENT);
const pproj = await ok('GET', `/api/projects/${pid2}`, CLIENT);
assert.equal(pproj.project.ratePerHour, 1200, 'rate comes from the library profile');
assert.equal(pproj.project.availableHours, php.typicalHours, 'hours come from the library profile');
assert.deepEqual(pproj.milestones.map((m) => m.amount), [13800, 18400, 13800], 'default 30/40/30 split adds up to the price');
assert.equal((await ok('GET', `/api/jobs/${pjob.id}`, CLIENT)).typicalTotal, 1200 * php.typicalHours);

console.log('smoke test passed');
