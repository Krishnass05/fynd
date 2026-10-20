'use strict';
// SOW reader and comparison. Plain JavaScript so it is tested with the rest of the engine.
// Understands text or markdown with headings such as "Deliverables", "Included deliverables",
// "Included", "Excluded (needs a change order)", followed by bullet lines. A person always
// reviews the result; this is a starting point, not a promise of accuracy.

const HEADINGS = [
  [/^(?:key\s+)?deliverables?$|^included\s+deliverables?$/i, 'deliverable'],
  [/^(?:included|in scope|scope of work|scope of services)$/i, 'included'],
  [/^(?:excluded|exclusions?|out of scope|assumptions? and exclusions?)$/i, 'excluded'],
];

const HOURS = /\(?\b(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b\)?/i;
const BULLET = /^(?:[-*•]|\d+[.)])\s+(.*)$/;

function headingSection(line) {
  const clean = line
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/[:*_]/g, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .trim();
  for (const [re, section] of HEADINGS) if (re.test(clean)) return section;
  return null;
}

function readRate(text) {
  const a = text.match(/rate[^\n\d₹]{0,30}₹?\s*([\d,]+)\s*(?:\/|per)\s*h/i);
  if (a) return Number(a[1].replace(/,/g, ''));
  const b = text.match(/rate\s+per\s+hour\W+(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
  return b ? Number(b[1].replace(/,/g, '')) : null;
}

function parseSow(text) {
  const items = [];
  let section = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const h = headingSection(line);
    if (h) {
      section = h;
      continue;
    }
    const bullet = line.match(BULLET);
    // Any other heading ("## Assumptions", "Notes:") ends the current section.
    if (!bullet && (/^#{1,6}\s/.test(line) || /^[A-Za-z][^.!?]*:$/.test(line))) {
      section = null;
      continue;
    }
    if (section && bullet) {
      let t = bullet[1];
      const m = t.match(HOURS);
      const hours = m ? Number(m[1]) : null;
      if (m) t = t.replace(HOURS, '');
      t = t.replace(/\s*[-–—:,]\s*$/, '').replace(/\s{2,}/g, ' ').trim();
      if (t) items.push({ section, text: t, hours });
    }
  }
  return { items, ratePerHour: readRate(String(text)) };
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const same = (a, b) => {
  const x = norm(a);
  const y = norm(b);
  return x === y || (x.length >= 6 && y.length >= 6 && (x.includes(y) || y.includes(x)));
};

// Labels: new, previously_excluded, changed (hours grew; hours = the extra), removed, unchanged.
function compareSow(baseline, amended) {
  const baseDeliv = baseline.filter((i) => i.section !== 'excluded');
  const baseExcl = baseline.filter((i) => i.section === 'excluded');
  const out = [];
  const matched = new Set();
  for (const item of amended.filter((i) => i.section !== 'excluded')) {
    const base = baseDeliv.find((b) => same(b.text, item.text));
    if (base) {
      matched.add(base);
      const grew = item.hours !== null && base.hours !== null && item.hours > base.hours;
      out.push({ label: grew ? 'changed' : 'unchanged', text: item.text, hours: grew ? item.hours - base.hours : item.hours });
    } else if (baseExcl.some((b) => same(b.text, item.text))) {
      out.push({ label: 'previously_excluded', text: item.text, hours: item.hours });
    } else {
      out.push({ label: 'new', text: item.text, hours: item.hours });
    }
  }
  for (const b of baseDeliv) if (!matched.has(b)) out.push({ label: 'removed', text: b.text, hours: b.hours });
  return out;
}

module.exports = { parseSow, compareSow };
