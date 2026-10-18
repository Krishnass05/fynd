'use strict';
// Contact guard: finds phone numbers, email addresses, social handles, links and similar personal details
// in text, including when they are written or spoken in words ("eight one two two nine ...", "name at gmail
// dot com"). It is used on chat messages (the details are hidden before saving) and on live call captions
// (the call is ended). It is a rule-based guard that works offline and is fully tested; a language model
// could be added later as a second opinion, but nothing here calls a model. Plain JavaScript, no dependencies.

const HIDDEN = '***REDACTED***';

const DIGIT_WORDS = {
  zero: 1, oh: 1, one: 1, two: 1, three: 1, four: 1, five: 1, six: 1, seven: 1, eight: 1, nine: 1,
  // Hindi digit words, as people say numbers in India
  shunya: 1, ek: 1, do: 1, teen: 1, char: 1, chaar: 1, paanch: 1, panch: 1, chhe: 1, chhah: 1, che: 1, saat: 1, aath: 1, nau: 1,
};
const TWO_DIGIT_WORDS = new Set([
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
]);
const TENS = new Set(['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']);
const MULTIPLIERS = { double: 2, triple: 3 };

// A run of digits (written or spoken) this long is a phone number or an ID. Plain digits need more
// because prices, hours and dates are short numbers; spoken-word runs are rare in normal talk.
const MIN_DIGITS_WRITTEN = 10;
const MIN_DIGITS_SPOKEN = 6;

const TLD = '(?:com|in|org|net|co|edu|io|me|info|biz|app|dev)';
const UPI = '(?:okaxis|okhdfcbank|okicici|oksbi|ybl|ibl|axl|paytm|upi|apl|sbi|icici|hdfcbank)';
const PLATFORMS = '(?:whats\\s?app|telegram|signal|skype|instagram|insta|snapchat|facebook|linkedin|discord)';

const PATTERNS = [
  // written email addresses and UPI ids
  ['email address', /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi],
  ['payment id', new RegExp(`[a-z0-9._-]+@${UPI}\\b`, 'gi')],
  // spoken: "name at gmail dot com", "name at the rate gmail dot com"
  ['email address', new RegExp(`\\b[a-z0-9_-]+(?:\\s+dot\\s+[a-z0-9_-]+)*\\s+(?:at\\s+the\\s+rate\\s+(?:of\\s+)?|at\\s+)[a-z0-9-]+(?:\\s+dot\\s+[a-z0-9-]+)*\\s+dot\\s+${TLD}\\b`, 'gi')],
  // links
  ['link', /\b(?:https?:\/\/|www\.)\S+/gi],
  ['link', new RegExp(`(?<![@\\w.-])[a-z0-9-]+\\.${TLD}(?:\\/\\S*)?\\b`, 'gi')],
  // a handle after a messaging app: "whatsapp me @priya", "telegram: priya_k"
  ['social handle', new RegExp(`\\b${PLATFORMS}\\b[\\s:=-]*(?:id|me|is|handle)?[\\s:=-]*@?[a-z0-9._]{3,}`, 'gi')],
  ['social handle', /(?:^|\s)@[a-z0-9._]{3,}/gi],
  // Indian PAN card
  ['ID number', /\b[A-Z]{5}\d{4}[A-Z]\b/g],
];

// Words that ask to move the conversation off the platform. These are flagged, not hidden.
const ASKS = [
  /\b(?:call|ring|phone|text|message|dm|ping|contact|reach)\s+me\b/i,
  /\b(?:my|your)\s+(?:phone\s+|mobile\s+|cell\s+|whats\s?app\s+|contact\s+)?(?:number|no\.?|email|e-?mail|id)\b/i,
  /\b(?:whats\s?app|telegram|signal|skype)\b/i,
  /\b(?:mail|email|e-?mail)\s+me\b/i,
  /\boutside\s+(?:the\s+)?(?:platform|site|app)\b/i,
  /\boff\s*[- ]?platform\b/i,
];

function tokenize(text) {
  const out = [];
  const re = /[A-Za-z]+|\d+|\s+|[^A-Za-z\d\s]/g;
  let m;
  while ((m = re.exec(text))) out.push({ t: m[0], start: m.index, end: m.index + m[0].length });
  return out;
}
const isSpace = (t) => /^\s+$/.test(t);
const SEP = new Set(['-', '.', '(', ')', '+', '/', ',']);

// Finds runs of digits that are written, spoken, or a mix, and returns their spans.
function digitRuns(text) {
  const toks = tokenize(text);
  const runs = [];
  let cur = null;
  const close = () => {
    if (cur && cur.digits > 0) runs.push(cur);
    cur = null;
  };
  for (let i = 0; i < toks.length; i += 1) {
    const { t, start, end } = toks[i];
    const w = t.toLowerCase();
    let digits = 0;
    let spoken = false;
    let consumed = 0; // extra tokens used (multiplier + digit word)
    if (/^\d+$/.test(t)) digits = t.length;
    else if (MULTIPLIERS[w]) {
      // "double eight": the multiplier and the next digit word
      let j = i + 1;
      while (j < toks.length && isSpace(toks[j].t)) j += 1;
      const nx = toks[j] && toks[j].t.toLowerCase();
      if (nx && DIGIT_WORDS[nx]) { digits = MULTIPLIERS[w]; spoken = true; consumed = j - i; }
    } else if (DIGIT_WORDS[w]) { digits = 1; spoken = true; }
    else if (TWO_DIGIT_WORDS.has(w)) {
      digits = 2; spoken = true;
      if (TENS.has(w)) {
        // "ninety eight": the tens word and a following digit word make one two-digit group
        let j = i + 1;
        while (j < toks.length && isSpace(toks[j].t)) j += 1;
        const nx = toks[j] && toks[j].t.toLowerCase();
        if (nx && DIGIT_WORDS[nx] && nx !== 'zero' && nx !== 'oh') consumed = j - i;
      }
    }
    if (digits > 0) {
      const endAt = consumed ? toks[i + consumed].end : end;
      if (!cur) cur = { start, end: endAt, digits: 0, spoken: false };
      cur.digits += digits;
      cur.end = endAt;
      cur.spoken = cur.spoken || spoken;
      i += consumed;
      continue;
    }
    // separators that can sit inside a phone number keep the run going; anything else ends it
    if (cur && (isSpace(t) || SEP.has(t))) continue;
    close();
  }
  close();
  return runs.filter((r) => r.digits >= (r.spoken ? MIN_DIGITS_SPOKEN : MIN_DIGITS_WRITTEN));
}

// Returns the text with contact details replaced, and what was found.
function scrub(text) {
  const found = [];
  const spans = [];
  PATTERNS.forEach(([kind, re]) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const lead = m[0].match(/^\s/) ? 1 : 0; // keep leading space of the handle pattern
      spans.push([m.index + lead, m.index + m[0].length]);
      found.push(kind);
      if (m[0].length === 0) re.lastIndex += 1;
    }
  });
  digitRuns(text).forEach((r) => { spans.push([r.start, r.end]); found.push(r.spoken ? 'phone number (said in words)' : 'phone number'); });

  // merge overlapping spans, then replace from the end so positions stay valid
  spans.sort((a, b) => a[0] - b[0]);
  const merged = [];
  spans.forEach(([s, e]) => {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  });
  let body = text;
  for (let i = merged.length - 1; i >= 0; i -= 1) body = body.slice(0, merged[i][0]) + HIDDEN + body.slice(merged[i][1]);

  const asks = ASKS.some((re) => re.test(text));
  const kinds = [...new Set(found)];
  return { body, redacted: merged.length > 0, kinds, asksOffPlatform: asks };
}

// For live calls: should this caption end the call?
function inspectSpeech(text) {
  const r = scrub(text);
  const reasons = [...r.kinds];
  if (r.asksOffPlatform) reasons.push('asking to talk off the platform');
  return { block: reasons.length > 0, reasons, safeText: r.body };
}

module.exports = { scrub, inspectSpeech, HIDDEN, MIN_DIGITS_WRITTEN, MIN_DIGITS_SPOKEN };
