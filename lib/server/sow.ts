// Minimal SOW reader and comparison. OWNER: Krishna. First version: understands text with
// headings like "Deliverables", "Included", "Excluded" followed by bullet lines.
// A person always reviews the result; this is a starting point, not a promise of accuracy.
import type { CompareItem, SowItem, SowSection } from '@/lib/types';

const HEADINGS: Array<[RegExp, SowSection]> = [
  [/^(?:key\s+)?deliverables?$/i, 'deliverable'],
  [/^(?:included|in scope|scope of work|scope of services)$/i, 'included'],
  [/^(?:excluded|exclusions?|out of scope|assumptions? and exclusions?)$/i, 'excluded'],
];

const HOURS = /\(?\b(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b\)?/i;

function headingSection(line: string): SowSection | null {
  const clean = line
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/[:*_]/g, '')
    .trim();
  for (const [re, section] of HEADINGS) if (re.test(clean)) return section;
  return null;
}

export function parseSow(text: string): { items: SowItem[]; ratePerHour: number | null } {
  const items: SowItem[] = [];
  let section: SowSection | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const h = headingSection(line);
    if (h) {
      section = h;
      continue;
    }
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (section && bullet) {
      let t = bullet[1];
      const m = t.match(HOURS);
      const hours = m ? Number(m[1]) : null;
      if (m) t = t.replace(HOURS, '');
      t = t.replace(/\s*[-–—:,]\s*$/, '').replace(/\s{2,}/g, ' ').trim();
      if (t) items.push({ section, text: t, hours });
    }
  }
  const rate = text.match(/rate[^\n\d₹]{0,30}₹?\s*([\d,]+)\s*(?:\/|per)\s*h/i);
  return { items, ratePerHour: rate ? Number(rate[1].replace(/,/g, '')) : null };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const same = (a: string, b: string) => {
  const x = norm(a);
  const y = norm(b);
  return x === y || (x.length >= 6 && y.length >= 6 && (x.includes(y) || y.includes(x)));
};

export function compareSow(baseline: SowItem[], amended: SowItem[]): CompareItem[] {
  const baseDeliv = baseline.filter((i) => i.section !== 'excluded');
  const baseExcl = baseline.filter((i) => i.section === 'excluded');
  const out: CompareItem[] = [];
  const matched = new Set<SowItem>();
  for (const item of amended.filter((i) => i.section !== 'excluded')) {
    const base = baseDeliv.find((b) => same(b.text, item.text));
    if (base) {
      matched.add(base);
      const grew = item.hours !== null && base.hours !== null && item.hours > base.hours;
      out.push({ label: grew ? 'changed' : 'unchanged', text: item.text, hours: grew ? item.hours! - base.hours! : item.hours });
    } else if (baseExcl.some((b) => same(b.text, item.text))) {
      out.push({ label: 'previously_excluded', text: item.text, hours: item.hours });
    } else {
      out.push({ label: 'new', text: item.text, hours: item.hours });
    }
  }
  for (const b of baseDeliv) if (!matched.has(b)) out.push({ label: 'removed', text: b.text, hours: b.hours });
  return out;
}
