// End-to-end smoke test of the API. Usage: start the app (npm run dev or npm start), then: npm run smoke
// Uses the in-memory store and resets it first. OWNER: Krishna.
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
// user is an id, or 'id:role' for an account that has both sides (sent as x-demo-user and x-demo-role)
const call = async (method, path, user, body) => {
  const [uid, role] = String(user ?? '').split(':');
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-demo-user': uid, 'x-demo-role': role ?? '' },
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

// login: right password works, wrong role / password / email are refused with clear messages
const L = (b) => call('POST', '/api/login', null, b);
assert.equal((await L({ email: 'Client@Demo.test', password: 'demo1234', role: 'client' })).data.id, 'u_client1');
assert.equal((await L({ email: 'client@demo.test', password: 'demo1234', role: 'freelancer' })).status, 403, 'wrong account type');
assert.equal((await L({ email: 'client@demo.test', password: 'nope', role: 'client' })).status, 403, 'wrong password');
assert.equal((await L({ email: 'not-an-email', password: 'x', role: 'client' })).status, 400, 'bad email');
assert.equal((await L({ email: 'client@demo.test', password: '', role: 'client' })).status, 400, 'missing password');

// the client profile shows the details the person registered with
assert.equal((await ok('GET', '/api/me', 'u_client1')).email, 'client@demo.test');

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
assert.equal(seedDash.stats.openJobs, 14, 'fourteen sample open jobs (J3 to J16) are open to apply to; J2 is already applied to');
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

// recent activity feed on the client dashboard: real events, newest first
assert.ok(cdash.activity.length >= 3, 'seed data produces activity');
assert.ok(cdash.activity.some((a) => a.kind === 'applicant'), 'applicants appear');
assert.ok(cdash.activity.some((a) => a.kind === 'milestone'), 'milestones appear');
assert.ok(cdash.activity.every((a, i, arr) => i === 0 || arr[i - 1].at >= a.at), 'newest first');
assert.ok(cdash.activity.every((a) => a.href.startsWith('/client/') && a.text && a.detail));

// saved freelancers: a client shortlist
const saved0 = await ok('GET', '/api/saved', CLIENT);
assert.deepEqual(saved0.map((f) => f.id), ['u_freelancer3'], 'seed shortlist');
const found = await ok('GET', '/api/freelancers', CLIENT);
assert.equal(found.freelancers.find((f) => f.id === 'u_freelancer3').saved, true);
assert.equal(found.freelancers.find((f) => f.id === 'u_freelancer2').saved, false);
assert.deepEqual(await ok('PUT', '/api/saved/u_freelancer2', CLIENT, { saved: true }), { saved: true });
assert.equal((await ok('GET', '/api/saved', CLIENT)).length, 2);
assert.equal((await ok('GET', '/api/freelancers/u_freelancer2', CLIENT)).saved, true, 'profile shows the saved state');
await ok('PUT', '/api/saved/u_freelancer2', CLIENT, { saved: false });
assert.equal((await ok('GET', '/api/saved', CLIENT)).length, 1);
assert.equal((await call('PUT', '/api/saved/u_freelancer2', CLIENT, { saved: 'yes' })).status, 400, 'saved must be true or false');
assert.equal((await call('PUT', '/api/saved/nobody', CLIENT, { saved: true })).status, 404);
assert.equal((await call('PUT', '/api/saved/u_freelancer2', FREE, { saved: true })).status, 403, 'only clients save');
assert.equal((await call('GET', '/api/saved', FREE)).status, 403);

// public landing page numbers: real counts, no sign-in
const pub = await call('GET', '/api/stats', '');
assert.equal(pub.status, 200);
assert.ok(pub.data.jobProfiles >= 20 && pub.data.sampleFreelancers >= 8);
assert.equal(pub.data.checksPassed, pub.data.checksTotal, 'all case checks pass');

// hiring: post, apply, accept
const job = await ok('POST', '/api/jobs', CLIENT, { title: 'Shop website', description: 'A small shop website with a contact form.', budget: 15000, deadline: '2026-12-01' });
assert.equal(job.status, 'open');
assert.equal((await call('POST', '/api/jobs', FREE, { title: 'x', description: 'y', budget: 1, deadline: '2026-12-01' })).status, 403, 'freelancer cannot post a job');
const app = await ok('POST', `/api/jobs/${job.id}/applications`, FREE, { pitch: 'I can do this.', proposedPrice: 14000 });
// the client can remove a pending applicant; others cannot, and it cannot be done twice
assert.equal((await call('POST', `/api/applications/${app.id}/reject`, FREE)).status, 403, 'only the job owner removes an applicant');
const spare = await ok('POST', `/api/jobs/${job.id}/applications`, 'u_freelancer1', { pitch: 'Me too.', proposedPrice: 15000 });
assert.equal((await ok('POST', `/api/applications/${spare.id}/reject`, CLIENT)).status, 'rejected');
assert.equal((await call('POST', `/api/applications/${spare.id}/reject`, CLIENT)).status, 409, 'already decided');
assert.equal((await ok('GET', `/api/jobs/${job.id}`, CLIENT)).job.status, 'open', 'removing an applicant leaves the job open');
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
assert.equal((await ok('GET', `/api/jobs/${job.id}`, CLIENT)).projectId, projectId, 'the job page links the client to the new project');
assert.equal((await ok('GET', `/api/jobs/${job.id}`, FREE)).projectId, projectId, 'and the hired freelancer');
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
// chat: both sides see the same thread; the server hides contact details, but not prices or dates
const hidden = await ok('POST', `/api/projects/${projectId}/messages`, CLIENT, { body: 'Mail me at owner@shop.in or call +91 98765 43210' });
assert.equal(hidden.redacted, true, 'contact details are flagged');
assert.ok(!hidden.body.includes('owner@shop.in') && !hidden.body.includes('98765'), 'email and phone are hidden: ' + hidden.body);
const plain = await ok('POST', `/api/projects/${projectId}/messages`, FREE, { body: 'Extra 6 hours at Rs 1000, due 2026-11-10' });
assert.equal(plain.redacted, undefined, 'prices, hours and dates are not touched');
assert.equal(plain.body, 'Extra 6 hours at Rs 1000, due 2026-11-10');
const thread = await ok('GET', `/api/projects/${projectId}/messages`, FREE);
assert.equal(thread.length, 3, 'the freelancer sees the client messages too');
assert.ok(thread.every((m) => !m.body.includes('owner@shop.in')), 'hidden text is what was saved');
assert.equal((await call('POST', `/api/projects/${projectId}/messages`, CLIENT, { body: '   ' })).status, 400, 'empty message refused');
assert.equal((await call('GET', `/api/projects/${projectId}/messages`, 'u_freelancer3')).status, 403, 'outsiders cannot read the chat');

// the guard also catches numbers and emails written out in words
const spelled = await ok('POST', `/api/projects/${projectId}/messages`, FREE, { body: 'sure, my number is eight one two two nine five five zero one two' });
assert.equal(spelled.redacted, true, 'a number said in words is hidden');
assert.ok(!/eight|nine|zero/.test(spelled.body), 'spelled digits are gone: ' + spelled.body);
assert.ok(spelled.hiddenKinds.includes('phone number (said in words)'));
const spokenMail = await ok('POST', `/api/projects/${projectId}/messages`, CLIENT, { body: 'write to priya at gmail dot com' });
assert.equal(spokenMail.redacted, true, 'a spoken email address is hidden');
assert.ok((await ok('POST', `/api/projects/${projectId}/messages`, CLIENT, { body: 'ping me on whatsapp' })).warning, 'asking to move off the platform is flagged');

// a number sent one digit per message is caught once the pieces add up, and the earlier pieces are hidden too;
// the other person's replies in between do not break the run
const piece = (b, who = FREE) => ok('POST', `/api/projects/${projectId}/messages`, who, { body: b });
for (const d of ['nine', 'eight', 'zer']) assert.equal((await piece(d)).redacted, undefined, 'a few digits alone are fine');
await piece('what?', CLIENT);
assert.equal((await piece('four')).redacted, undefined);
await piece('two');
const sixth = await piece('six');
assert.equal(sixth.redacted, true, 'the sixth digit completes a phone number');
assert.ok(sixth.hiddenKinds.includes('phone number (sent in pieces)'));
assert.equal((await piece('one')).redacted, true, 'the rest of the number stays hidden');
const afterPieces = await ok('GET', `/api/projects/${projectId}/messages`, CLIENT);
assert.ok(!afterPieces.some((m) => m.senderId === FREE && /^(nine|eight|zer|four|two|six|one)$/.test(m.body)), 'none of the pieces can be read');
assert.ok(afterPieces.some((m) => m.body === 'what?'), 'the other person\'s message is untouched');
assert.equal((await piece('Sounds good, see you Monday')).redacted, undefined, 'normal chat carries on');

// calls: ringing, signalling, live captions, and the call ending when contact details are said
const ring = await ok('POST', `/api/projects/${projectId}/call`, CLIENT, { mode: 'video' });
assert.equal(JSON.parse(ring.payload).mode, 'video');
const rung = await ok('GET', `/api/projects/${projectId}/call/signals?since=0`, FREE);
assert.ok(rung.some((x) => x.type === 'ring' && x.fromUserId === CLIENT), 'the other person is rung');
assert.equal((await ok('GET', `/api/projects/${projectId}/call/signals?since=0`, CLIENT)).filter((x) => x.type === 'ring').length, 0, 'the caller does not get their own ring');
assert.equal((await call('GET', `/api/projects/${projectId}/call/signals?since=0`, 'u_freelancer3')).status, 403, 'outsiders cannot listen');
assert.equal((await call('POST', `/api/projects/${projectId}/call/signal`, 'u_freelancer3', { type: 'offer' })).status, 403, 'outsiders cannot signal');
assert.equal((await call('POST', `/api/projects/${projectId}/call/signal`, FREE, { type: 'caption' })).status, 400, 'captions only go through the guard');
await ok('POST', `/api/projects/${projectId}/call/signal`, FREE, { type: 'answer', payload: '{"sdp":"x"}' });
const lastSeq = Math.max(...(await ok('GET', `/api/projects/${projectId}/call/signals?since=0`, CLIENT)).map((x) => x.seq));
const clean = await ok('POST', `/api/projects/${projectId}/call/caption`, FREE, { text: 'The extra work is six hours at one thousand rupees.' });
assert.equal(clean.blocked, false);
const cap = await ok('GET', `/api/projects/${projectId}/call/signals?since=${lastSeq}`, CLIENT);
assert.ok(cap.some((x) => x.type === 'caption' && x.payload.includes('six hours')), 'a clean line shows up as a caption for the other person');
const cut = await ok('POST', `/api/projects/${projectId}/call/caption`, FREE, { text: 'okay, my number is nine eight seven six five four three two one zero' });
assert.equal(cut.blocked, true, 'a spoken phone number ends the call');
assert.ok(cut.reasons.includes('phone number (said in words)'));
const after = await ok('GET', `/api/projects/${projectId}/call/signals?since=${lastSeq}`, CLIENT);
const hang = after.find((x) => x.type === 'hangup');
assert.equal(JSON.parse(hang.payload).reason, 'guard', 'the other person is hung up on, with the reason');
assert.ok(!after.some((x) => /nine|zero/.test(x.payload) && x.type === 'caption'), 'the spoken number is never sent on as a caption');
const log = await ok('GET', `/api/projects/${projectId}/messages`, CLIENT);
assert.ok(log.some((m) => m.senderId === 'platform' && /call was ended/.test(m.body) && !/nine|zero/.test(m.body)), 'the chat records that the call was ended, without the details');
assert.equal((await ok('POST', `/api/projects/${projectId}/call/caption`, CLIENT, { text: 'mail me at owner at shop dot in' })).blocked, true, 'a spoken email ends the call too');
assert.equal((await call('POST', `/api/projects/${projectId}/call/caption`, FREE, { text: '   ' })).status, 400, 'empty caption refused');

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

// browsing freelancers (client side): list, search, filters, profile, role limits
const users = await ok('GET', '/api/users');
assert.deepEqual(users.map((u) => u.id).sort(), ['u_both1', 'u_client1', 'u_freelancer1', 'u_freelancer2'], 'login page offers only the demo users');
const all = await ok('GET', '/api/freelancers', CLIENT);
assert.ok(all.freelancers.length >= 8, 'sample freelancers are listed');
assert.ok(all.categories.length >= 2 && all.skills.length >= 10, 'filter options are returned');
assert.ok(all.freelancers.every((f, i, a) => i === 0 || (a[i - 1].rating ?? 0) >= (f.rating ?? 0)), 'best rated first');
const logo = await ok('GET', '/api/freelancers?q=logo', CLIENT);
assert.ok(logo.freelancers.some((f) => f.id === 'u_freelancer2'), 'search finds a skill');
assert.ok(logo.freelancers.length < all.freelancers.length);
const cat = all.categories[0];
assert.ok((await ok('GET', '/api/freelancers?category=' + encodeURIComponent(cat), CLIENT)).freelancers.every((f) => f.category === cat), 'category filter');
const cheap = await ok('GET', '/api/freelancers?maxRate=1000', CLIENT);
assert.ok(cheap.freelancers.length > 0 && cheap.freelancers.every((f) => f.ratePerHour <= 1000), 'rate filter');
assert.ok((await ok('GET', '/api/freelancers?available=1', CLIENT)).freelancers.every((f) => f.availability === 'available'), 'availability filter');
assert.equal((await ok('GET', '/api/freelancers?q=zzzzzz', CLIENT)).freelancers.length, 0, 'no match gives an empty list');
// every topic in the Services menu (lib/services.ts) finds at least one sample freelancer
import { readFileSync } from 'node:fs';
const topicLists = [...readFileSync(new URL('../lib/services.ts', import.meta.url), 'utf8').matchAll(/topics: \[([^\]]*)\]/g)];
const topics = topicLists.flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
assert.ok(topics.length >= 25, 'read the topics from lib/services.ts');
for (const t of topics) {
  assert.ok((await ok('GET', '/api/freelancers?q=' + encodeURIComponent(t), CLIENT)).freelancers.length > 0, 'Services topic finds a freelancer: ' + t);
}
// the freelancer side has open jobs in every Services domain to search and apply to
const openJobs = await ok('GET', '/api/jobs', 'u_freelancer1');
for (const cat of ['Websites, IT and Software', 'Design, Media and Architecture', 'Engineering and Science', 'Business, Accounting, Human Resources and Legal', 'Data Entry and Admin']) {
  assert.ok(openJobs.some((j) => j.status === 'open' && j.category === cat), 'open job in domain: ' + cat);
}
// every popular search on the client home page finds someone, by words rather than the exact phrase
for (const t of ['Web Development', 'Logo Design', 'Video Editing', 'SEO', 'Data Entry', 'Graphic Design', 'PHP']) {
  assert.ok((await ok('GET', '/api/freelancers?q=' + encodeURIComponent(t), CLIENT)).freelancers.length > 0, 'popular search finds a freelancer: ' + t);
}
assert.equal((await call('GET', '/api/freelancers?maxRate=-5', CLIENT)).status, 400);
assert.equal((await call('GET', '/api/freelancers', FREE)).status, 403, 'only clients browse');
const prof = await ok('GET', '/api/freelancers/u_freelancer2', CLIENT);
// profiles: previous work, past clients and reviews (sample), and client profiles with company details
assert.ok(prof.portfolio.length >= 2 && prof.workedWith.length >= 2 && prof.reviews.length >= 3, 'freelancer profile has previous work, past clients and reviews');
assert.ok(prof.rating >= 1 && prof.rating <= 5 && prof.reviewCount === prof.reviews.length, 'rating comes from the reviews');
assert.equal((await ok('GET', '/api/freelancers/u_freelancer2', FREE)).id, 'u_freelancer2', 'a freelancer can open a profile too');
const cp = await ok('GET', '/api/clients/u_client1', CLIENT);
assert.equal(cp.company.name, 'Brew & Beans Cafe');
assert.equal(cp.email, 'client@demo.test', 'a client sees their own email');
assert.ok(cp.reviews.length >= 3 && cp.rating >= 1 && cp.stats.jobsPosted >= 2);
const seen = await ok('GET', '/api/clients/u_client1', FREE);
assert.equal(seen.email, undefined, 'other people do not see the email');
assert.equal((await call('GET', '/api/clients/u_freelancer2', CLIENT)).status, 404, 'only clients have a client profile');
assert.equal((await ok('GET', '/api/jobs/J2', FREE)).client.company, 'Brew & Beans Cafe', 'the job shows who posted it');
assert.ok(prof.overview.length > 10 && prof.skills.includes('Logo design'));
assert.equal((await call('GET', '/api/freelancers/u_client1', CLIENT)).status, 404, 'a client is not a freelancer profile');
assert.equal((await call('GET', '/api/freelancers/nobody', CLIENT)).status, 404);
// (a freelancer may open a freelancer profile, checked above; the search list stays client-only)

// a freelancer edits their own profile and clients see the change
const upd = await ok('PUT', '/api/me', FREE, { headline: 'Brand marks that work on a cafe sign', ratePerHour: 1100, location: 'Pune' });
assert.equal(upd.ratePerHour, 1100);
assert.equal((await ok('GET', '/api/freelancers/u_freelancer2', CLIENT)).headline, 'Brand marks that work on a cafe sign');
assert.equal((await call('PUT', '/api/me', FREE, { ratePerHour: 0 })).status, 400, 'rate must be above 0');
assert.equal((await call('PUT', '/api/me', FREE, { headline: '' })).status, 400, 'headline cannot be empty');

// one account, both sides: log in as either, act as each, but never hire or apply to yourself
const both = (r) => L({ email: 'both@demo.test', password: 'demo1234', role: r });
assert.equal((await both('client')).data.role, 'client');
assert.equal((await both('freelancer')).data.role, 'freelancer');
assert.equal((await ok('GET', '/api/me', 'u_both1:freelancer')).role, 'freelancer', 'acts as the freelancer');
assert.equal((await ok('GET', '/api/me', 'u_both1:client')).role, 'client', 'acts as the client');
assert.deepEqual((await ok('GET', '/api/me', 'u_both1')).roles, ['client', 'freelancer']);
assert.equal((await call('GET', '/api/me', 'u_client1:freelancer')).data.role, 'client', 'a one-side account cannot take the other side');
const bothJob = await ok('POST', '/api/jobs', 'u_both1:client', { title: 'Brand sheet', description: 'One page brand sheet.', budget: 5000, deadline: '2026-12-01' });
assert.equal((await call('POST', '/api/jobs', 'u_both1:freelancer', { title: 'x', description: 'y', budget: 1, deadline: '2026-12-01' })).status, 403, 'as a freelancer it cannot post a job');
assert.equal((await call('POST', `/api/jobs/${bothJob.id}/applications`, 'u_both1:freelancer', { pitch: 'Me', proposedPrice: 4000 })).status, 403, 'cannot apply to its own job');
assert.ok((await ok('GET', '/api/jobs', 'u_both1:freelancer')).some((j) => j.id === 'J3'), 'as a freelancer it sees open jobs');
assert.ok((await ok('GET', '/api/freelancers?q=copywriting', CLIENT)).freelancers.some((f) => f.id === 'u_both1'), 'its freelancer side can be found');
assert.equal((await ok('GET', '/api/clients/u_both1', FREE)).company.name, 'Quill & Co Studio', 'its client side has company details');


// ---- real accounts: register, log in, sessions, lockout, logout ----
const raw = async (method, path, { cookie, user, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(user ? { 'x-demo-user': user } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.getSetCookie?.() ?? [];
  const sess = set.find((c) => c.startsWith('cd_session='));
  return { status: res.status, data: await res.json(), set, cookie: sess ? sess.split(';')[0] : null, flags: sess ?? '' };
};
const reg = (over = {}) => ({ name: 'Priya Rao', email: 'priya.rao@example.com', password: 'Sunrise42', confirmPassword: 'Sunrise42', accountType: 'client', acceptedTerms: true, ...over });
const cfgAuth = await ok('GET', '/api/auth/config');
assert.equal(typeof cfgAuth.google, 'boolean', 'the pages can ask whether Google sign-in is on');

// the form is validated on the server too, with a message per field
const weak = await raw('POST', '/api/auth/register', { body: reg({ name: '', email: 'nope', password: 'abc', confirmPassword: 'x', accountType: 'boss', acceptedTerms: false }) });
assert.equal(weak.status, 400);
for (const f of ['name', 'email', 'password', 'accountType', 'acceptedTerms']) assert.ok(weak.data.fields[f], 'a message for ' + f);
assert.equal((await raw('POST', '/api/auth/register', { body: reg({ confirmPassword: 'Sunrise43' }) })).data.fields.confirmPassword, 'The two passwords do not match');
assert.equal((await raw('POST', '/api/auth/register', { body: reg({ password: 'Password1', confirmPassword: 'Password1' }) })).status, 400, 'a common password is refused');
assert.equal((await raw('POST', '/api/auth/register', { body: reg({ name: '<script>x</script>' }) })).status, 400, 'a name with markup is refused');
assert.equal((await raw('POST', '/api/auth/register', { body: reg({ email: 'client@demo.test' }) })).status, 400, 'a demo email cannot be taken');
assert.equal((await raw('POST', '/api/auth/register', { body: 'not an object' })).status, 400, 'junk is refused, not a crash');

// a good sign-up: an account, a signed HTTP-only cookie, and no password in the reply
const made = await raw('POST', '/api/auth/register', { body: reg({ email: '  Priya.Rao@Example.COM ', accountType: 'both' }) });
assert.equal(made.status, 200);
assert.equal(made.data.email, 'priya.rao@example.com', 'the email is stored lower case');
assert.deepEqual(made.data.roles, ['client', 'freelancer']);
assert.equal(made.data.emailVerified, false, 'not verified until the email step exists');
assert.ok(!JSON.stringify(made.data).match(/password|hash|scrypt|Sunrise/i), 'nothing secret in the reply');
assert.ok(made.cookie && /HttpOnly/i.test(made.flags) && /SameSite=Lax/i.test(made.flags), 'a signed HTTP-only cookie');
const me = await raw('GET', '/api/me', { cookie: made.cookie });
assert.equal(me.data.id, made.data.id, 'the cookie alone is enough to be recognised');
assert.equal((await raw('POST', '/api/auth/register', { body: reg({ email: 'PRIYA.rao@example.com' }) })).data.fields.email.includes('already exists'), true, 'no second account for the same email');

// nobody can pretend to be a real account
assert.equal((await raw('GET', '/api/me', { user: made.data.id })).status, 403, 'the id alone is not enough');
assert.equal((await raw('GET', '/api/me', { cookie: made.cookie.slice(0, -3) + 'xyz', user: made.data.id })).status, 403, 'a tampered cookie is refused');
const other = await raw('POST', '/api/auth/register', { body: reg({ name: 'Second Person', email: 'second.person@example.com' }) });
assert.equal((await raw('GET', '/api/me', { cookie: other.cookie, user: made.data.id })).status, 403, "one account's cookie cannot act as another");
assert.equal((await raw('GET', '/api/me', { user: 'u_client1' })).data.id, 'u_client1', 'demo accounts still work with the id');

// log in with the password, in any case of the email, and the wrong ones fail the same way
const ok1 = await raw('POST', '/api/login', { body: { email: 'PRIYA.RAO@example.com', password: 'Sunrise42', role: 'freelancer' } });
assert.equal(ok1.status, 200);
assert.equal(ok1.data.role, 'freelancer', 'a both-sides account picks its side');
assert.ok(ok1.cookie);
const wrongPw = await raw('POST', '/api/login', { body: { email: 'priya.rao@example.com', password: 'Sunrise43', role: 'client' } });
const noUser = await raw('POST', '/api/login', { body: { email: 'nobody@example.com', password: 'Sunrise42', role: 'client' } });
assert.equal(wrongPw.status, 403);
assert.equal(wrongPw.data.error, noUser.data.error, 'a wrong password and an unknown email say the same thing');
assert.equal((await raw('POST', '/api/login', { body: { email: 'second.person@example.com', password: 'Sunrise42', role: 'freelancer' } })).status, 403, 'a client-only account cannot log in as a freelancer');
assert.equal((await raw('POST', '/api/login', { body: { email: 'bad', password: '', role: 'x' } })).data.fields.email.length > 0, true, 'the log-in form is validated on the server');

// five wrong passwords lock the email for a while, even for the right password
for (let i = 0; i < 5; i += 1) await raw('POST', '/api/login', { body: { email: 'second.person@example.com', password: 'wrongpass' + i, role: 'client' } });
const locked = await raw('POST', '/api/login', { body: { email: 'second.person@example.com', password: 'Sunrise42', role: 'client' } });
assert.equal(locked.status, 429, 'locked after repeated wrong passwords');
assert.match(locked.data.error, /Try again in/);
assert.equal((await raw('POST', '/api/login', { body: { email: 'priya.rao@example.com', password: 'Sunrise42', role: 'client' } })).status, 200, 'other accounts are not affected');

// log out ends the session
const out = await raw('POST', '/api/auth/logout', { cookie: made.cookie });
assert.ok(out.set.some((c) => c.startsWith('cd_session=') && /Max-Age=0/i.test(c)), 'the cookie is cleared');
assert.equal((await raw('GET', '/api/me', { user: made.data.id })).status, 403);

// a new freelancer account appears in the marketplace like any other
const fl = await raw('POST', '/api/auth/register', { body: reg({ name: 'Anil Kumar', email: 'anil.kumar@example.com', accountType: 'freelancer' }) });
assert.equal(fl.data.role, 'freelancer');
assert.ok((await raw('GET', '/api/freelancers?q=anil', { cookie: (await raw('POST', '/api/login', { body: { email: 'client@demo.test', password: 'demo1234', role: 'client' } })).cookie, user: 'u_client1' })).data.freelancers.some((f) => f.name === 'Anil Kumar'), 'a new freelancer can be found');


// one login, both sides: a one-side account adds the other side
const solo = await raw('POST', '/api/auth/register', { body: reg({ name: 'Solo Client', email: 'solo.client@example.com', accountType: 'client' }) });
assert.equal(solo.data.roles, undefined);
assert.equal((await raw('GET', '/api/dashboard', { cookie: solo.cookie, user: solo.data.id })).status, 403, 'a client account has no freelancer side yet');
assert.equal((await raw('POST', '/api/auth/add-role', { body: { role: 'freelancer' } })).status, 403, 'you must be signed in to add a side');
assert.equal((await raw('POST', '/api/auth/add-role', { cookie: solo.cookie, user: solo.data.id, body: { role: 'admin' } })).status, 400, 'only client or freelancer');
assert.equal((await raw('POST', '/api/auth/add-role', { cookie: solo.cookie, user: solo.data.id, body: { role: 'client' } })).status, 409, 'it already has a client side');
const added = await raw('POST', '/api/auth/add-role', { cookie: solo.cookie, user: solo.data.id, body: { role: 'freelancer' } });
assert.equal(added.status, 200);
assert.deepEqual(added.data.roles, ['client', 'freelancer']);
assert.equal(added.data.id, solo.data.id, 'the same account');
assert.equal(added.data.role, 'freelancer');
const sideHeaders = (side) => ({ cookie: solo.cookie, user: solo.data.id, side });
const asFreelancer = await fetch(BASE + '/api/dashboard', { headers: { cookie: solo.cookie, 'x-demo-user': solo.data.id, 'x-demo-role': 'freelancer' } });
assert.equal(asFreelancer.status, 200, 'the freelancer side works after adding it');
const asClient = await fetch(BASE + '/api/client-dashboard', { headers: { cookie: solo.cookie, 'x-demo-user': solo.data.id, 'x-demo-role': 'client' } });
assert.equal(asClient.status, 200, 'and the client side still works');
assert.equal((await raw('POST', '/api/auth/add-role', { cookie: solo.cookie, user: solo.data.id, body: { role: 'freelancer' } })).status, 409, 'it cannot be added twice');
assert.equal((await raw('POST', '/api/auth/add-role', { user: 'u_client1', body: { role: 'freelancer' } })).status, 403, 'demo accounts cannot add a side');
void sideHeaders;
console.log('smoke test passed');
