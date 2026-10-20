'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { suggestTask } = require('./taskrules.js');

// the scope from the case data (fixture.json)
const scope = { included: ['one landing page', 'contact form'], excluded: ['payment checkout'] };
const label = (t, s = scope) => suggestTask(t, s).label;

test('the two case requests get the expected labels', () => {
  assert.equal(label('Add payment checkout'), 'excluded');
  assert.match(suggestTask('Add payment checkout', scope).reason, /excluded in the signed SOW/);
  assert.equal(label('Fix our broken contact form'), 'defect');
  assert.match(suggestTask('Fix our broken contact form', scope).reason, /contact form/);
});

test('wording and plurals do not matter', () => {
  assert.equal(label('Can we also take payments at checkout?'), 'excluded');
  assert.equal(label('Please add a second field to the contact forms'), 'included');
  assert.equal(label('The landing page needs a hero image'), 'included');
});

test('new work, unclear asks and defects', () => {
  assert.equal(label('Can you also add a blog page with 3 posts?'), 'new');
  assert.equal(label('Make it look better'), 'unclear');
  assert.equal(label('some tweaks please'), 'unclear');
  assert.equal(label('The site crashes on mobile'), 'defect');
  assert.equal(label('Login is not working'), 'defect');
});

test('without a signed SOW nothing is called included or excluded, and the reason says so', () => {
  const none = { included: [], excluded: [] };
  assert.equal(label('Add payment checkout', none), 'new');
  assert.match(suggestTask('Add payment checkout', none).reason, /no signed SOW/);
  assert.equal(label('Fix the contact form', none), 'defect');
  assert.equal(suggestTask('Add a blog', undefined).label, 'new', 'missing scope is treated as none');
  assert.equal(suggestTask('Add a blog').source, 'rules', 'the source is labelled');
});
