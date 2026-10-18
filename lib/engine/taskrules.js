'use strict';
// Suggests what a client's plain-English request is, compared with the signed scope: already included, excluded in
// the SOW, new work, a fix of something that should already work, or too unclear to price. It is only a suggestion:
// the freelancer decides (docs/SCOPE_FLOW.md, step 3). Rule-based, offline, no dependencies. OWNER: Krishna.

const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'for', 'on', 'in', 'with', 'our', 'my', 'your', 'one', 'page', 'pages']);
const DEFECT = /\b(fix|fixing|broken|bug|bugs|not working|doesn'?t work|does not work|error|errors|crash|crashes|crashing|failing|fails)\b/i;
const VAGUE = new Set(['better', 'nicer', 'improve', 'improvements', 'change', 'changes', 'stuff', 'things', 'some', 'something', 'tweak', 'tweaks', 'update', 'updates', 'modern', 'pop', 'more', 'make', 'it', 'look', 'bit', 'little', 'please', 'can', 'you', 'do', 'just']);

const words = (s) => String(s).toLowerCase().match(/[a-z0-9]+/g) ?? [];
const stem = (w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);

// Does the request mention this scope item? All of the item's meaningful words must appear in the request.
function mentions(text, item) {
  const have = new Set(words(text).map(stem));
  const need = words(item).filter((w) => !STOP.has(w)).map(stem);
  if (need.length === 0) return false;
  return need.every((w) => have.has(w));
}

// scope: { included: string[], excluded: string[] } from the signed SOW (both empty if none is signed yet)
function suggestTask(text, scope = { included: [], excluded: [] }) {
  const t = String(text ?? '').trim();
  const included = Array.isArray(scope?.included) ? scope.included : [];
  const excluded = Array.isArray(scope?.excluded) ? scope.excluded : [];
  const signed = included.length + excluded.length > 0;
  const noSow = signed ? '' : ' There is no signed SOW yet, so this could not be checked against one.';

  const ex = excluded.find((x) => mentions(t, x));
  if (ex) return { label: 'excluded', matched: ex, reason: `"${ex}" was excluded in the signed SOW, so this is a paid change.`, source: 'rules' };

  if (DEFECT.test(t)) {
    const inc = included.find((x) => mentions(t, x));
    return {
      label: 'defect', matched: inc ?? null, source: 'rules',
      reason: `${inc ? `"${inc}" is in the signed SOW and this` : 'This'} sounds like fixing something that should already work. If it is the freelancer's own bug, it is fixed at no charge.${noSow}`,
    };
  }

  const inc = included.find((x) => mentions(t, x));
  if (inc) return { label: 'included', matched: inc, reason: `Looks like part of "${inc}", which is already in the signed SOW, so no extra charge.`, source: 'rules' };

  const meaningful = words(t).filter((w) => !STOP.has(w) && !VAGUE.has(w));
  if (meaningful.length < 2) {
    return { label: 'unclear', matched: null, reason: 'Too vague to price. Say what should be added or changed, and where.', source: 'rules' };
  }
  return { label: 'new', matched: null, reason: `Not in the signed SOW, so this is new work: a paid change once both sides agree a price.${noSow}`, source: 'rules' };
}

module.exports = { suggestTask, mentions };
