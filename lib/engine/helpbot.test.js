'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { answer, answerFor, suggestions, GUIDE } = require('./helpbot.js');

const id = (q, role) => answer(q, role).matched;

test('common questions get the right answer', () => {
  const cases = [
    ['How do I post a job?', 'client', 'post-job'],
    ['how can i hire a freelancer', 'client', 'applicants'],
    ['How do I remove an applicant?', 'client', 'remove-applicant'],
    ['where do I upload the signed SOW', 'freelancer', 'sow-freelancer'],
    ['how do I ask for more work', 'client', 'sow-client'],
    ['How is a change priced?', 'client', 'pricing'],
    ['what happens when I reject a change', 'client', 'approve-reject'],
    ['I uploaded the same document twice, will I be charged twice', 'client', 'repeat-upload'],
    ['how do I apply for a job', 'freelancer', 'find-jobs'],
    ['my client wants extra work, what do I do', 'freelancer', 'extra-work-freelancer'],
    ['can I share my phone number in chat', 'freelancer', 'chat'],
    ['how do video calls work', 'client', 'calls'],
    ['is there escrow or payment protection', 'client', 'payments'],
    ['how do I switch between client and freelancer', 'client', 'switch'],
    ['is this legal advice', 'client', 'legal'],
    ['can I upload a PDF', 'freelancer', 'files'],
    ['is there a rush charge for urgent work', 'client', 'urgent'],
  ];
  for (const [q, role, want] of cases) assert.equal(id(q, role), want, q);
});

test('the answer is the one meant for the person asking', () => {
  assert.equal(id('how do I upload the SOW', 'freelancer'), 'sow-freelancer');
  assert.notEqual(id('where do I search', 'freelancer'), 'find-freelancers');
  assert.equal(id('how do I find work', 'freelancer'), 'find-jobs');
  assert.equal(id('how do I find freelancers', 'client'), 'find-freelancers');
});

test('an unknown question says so and offers topics, without inventing an answer', () => {
  const r = answer('what is the weather in Pune tomorrow', 'client');
  assert.equal(r.matched, undefined);
  assert.match(r.text, /not sure/i);
  assert.ok(r.topics.length >= 4);
});

test('greetings, thanks and empty input are handled', () => {
  assert.match(answer('hi', 'client').text, /Hello/);
  assert.match(answer('thanks', 'client').text, /welcome/i);
  assert.ok(answer('', 'client').topics.length > 0);
  assert.doesNotThrow(() => answer(undefined, undefined));
  assert.doesNotThrow(() => answer('x'.repeat(5000), 'client'));
});

test('suggested topics exist for each kind of visitor and point at real answers', () => {
  for (const role of ['client', 'freelancer', undefined]) {
    const s = suggestions(role);
    assert.ok(s.length >= 5, String(role));
    for (const t of s) assert.ok(answerFor(t.id), t.id);
  }
  assert.equal(answerFor('nope'), null);
});

test('the guide is consistent: unique ids, real links, and the facts the site depends on', () => {
  assert.equal(new Set(GUIDE.map((e) => e.id)).size, GUIDE.length);
  for (const e of GUIDE) {
    assert.ok(e.answer.length > 40, e.id);
    for (const l of e.links) assert.match(l.href, /^\/(client|freelancer|login)/, e.id);
  }
  const pricing = answerFor('pricing').text;
  assert.match(pricing, /6000/);
  assert.match(pricing, /before tax/i);
  assert.match(pricing, /unknown is never treated as zero/i);
  assert.match(answerFor('payments').text, /no money moves/i);
  assert.match(answerFor('legal').text, /not legal advice/i);
});
