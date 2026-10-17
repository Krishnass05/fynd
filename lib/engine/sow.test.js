'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseSow, compareSow } = require('./sow.js');

// The same shape as the team's markdown SOW template (docs/sow/README.md).
const TEMPLATE = `# PHP Development

**Category:** Websites, IT and Software
**Currency:** INR
**Rate per hour:** 1200
**Assumed total hours:** 40

## Included deliverables
- Object-oriented PHP backend modules (18 hours)
- MySQL database schema design (12 hours)

## Excluded (needs a change order)
- Third-party payment gateway integration (10 hours)
- Frontend UI redesign and CSS styling (15 hours)

## Common change requests and typical extra hours
| Request a client might make | Typical extra hours |
| --- | --- |
| Integrate Razorpay | 10 |

## Assumptions
- Server runs PHP 8.1 or newer.
- 2 rounds of review revisions included.
`;

const find = (items, section, text) => items.find((i) => i.section === section && i.text === text);

test('reads the team SOW template: sections, hours and rate', () => {
  const { items, ratePerHour } = parseSow(TEMPLATE);
  assert.equal(ratePerHour, 1200);
  assert.equal(find(items, 'deliverable', 'Object-oriented PHP backend modules').hours, 18);
  assert.equal(find(items, 'deliverable', 'MySQL database schema design').hours, 12);
  assert.equal(find(items, 'excluded', 'Third-party payment gateway integration').hours, 10);
  assert.equal(items.filter((i) => i.section === 'excluded').length, 2);
});

test('assumptions and tables after the excluded list are not read as excluded items', () => {
  const { items } = parseSow(TEMPLATE);
  assert.ok(!items.some((i) => /PHP 8\.1|review revisions|Razorpay/i.test(i.text)));
  assert.equal(items.length, 4);
});

test('reads the simple style and a Rate: Rs 1000/hr line; unknown hours stay null', () => {
  const { items, ratePerHour } = parseSow('Rate: Rs 1000/hr\n\nDeliverables\n- One landing page\n\nExcluded\n- Payment checkout (6 hours)\n');
  assert.equal(ratePerHour, 1000);
  assert.equal(find(items, 'deliverable', 'One landing page').hours, null);
  assert.equal(find(items, 'excluded', 'Payment checkout').hours, 6);
});

test('text with no recognisable headings gives no items', () => {
  assert.deepEqual(parseSow('Just a paragraph of text with no list at all.').items, []);
  assert.equal(parseSow('').ratePerHour, null);
});

test('compare labels: previously excluded, new, changed, removed, unchanged', () => {
  const baseline = parseSow('Deliverables\n- One landing page (10 hours)\n- Contact form\n- Old banner\n\nExcluded\n- Payment checkout\n').items;
  const amended = parseSow('Deliverables\n- One landing page (14 hours)\n- Contact form\n- Payment checkout (6 hours)\n- Loyalty page (4 hours)\n').items;
  const byText = Object.fromEntries(compareSow(baseline, amended).map((i) => [i.text, i]));
  assert.equal(byText['Payment checkout'].label, 'previously_excluded');
  assert.equal(byText['Payment checkout'].hours, 6);
  assert.equal(byText['Loyalty page'].label, 'new');
  assert.equal(byText['One landing page'].label, 'changed');
  assert.equal(byText['One landing page'].hours, 4, 'only the extra hours are charged');
  assert.equal(byText['Contact form'].label, 'unchanged');
  assert.equal(byText['Old banner'].label, 'removed');
});
