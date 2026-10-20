'use strict';
// Password hashing, signed session cookies, signed one-time state, and a log-in attempt limiter. Uses only node:crypto.
// Passwords are never stored: only a salted scrypt hash. Sessions are signed (HMAC-SHA256) so they cannot be forged,
// and they expire. Plain JavaScript, tested.
const crypto = require('node:crypto');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

// Always does the same amount of work, even for a malformed hash, so timing does not give away much.
function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') {
    crypto.scryptSync(String(password), Buffer.alloc(16), SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
    return false;
  }
  const N = Number(parts[1]);
  const salt = Buffer.from(parts[2], 'base64');
  const want = Buffer.from(parts[3], 'base64');
  const got = crypto.scryptSync(String(password), salt, want.length, { N, r: SCRYPT.r, p: SCRYPT.p });
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

// A hash that never matches anything, used to spend the same time when the email is unknown.
const DUMMY_HASH = hashPassword(crypto.randomBytes(12).toString('hex'));

const b64 = (b) => Buffer.from(b).toString('base64url');
const mac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

// A signed token: base64url(JSON payload) + '.' + signature. exp is in milliseconds since 1970.
function sign(secret, payload, ttlMs, now = Date.now()) {
  const body = b64(JSON.stringify({ ...payload, exp: now + ttlMs }));
  return `${body}.${mac(secret, body)}`;
}

function verify(secret, token, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 2000) return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const want = mac(secret, body);
  if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof p.exp !== 'number' || p.exp < now) return null;
    return p;
  } catch {
    return null;
  }
}

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function readCookie(header, name) {
  if (!header) return null;
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

// Log-in attempt limiter: after `max` failures for a key within `windowMs`, it locks for `lockMs`.
// `initial` lets the counts be restored from a database (see dump()).
function createLimiter({ max = 5, windowMs = 15 * 60 * 1000, lockMs = 10 * 60 * 1000 } = {}, initial = []) {
  const seen = new Map(Array.isArray(initial) ? initial : []);
  return {
    // Returns 0 if allowed, or the number of milliseconds still to wait.
    check(key, now = Date.now()) {
      const e = seen.get(key);
      return e && e.until && e.until > now ? e.until - now : 0;
    },
    fail(key, now = Date.now()) {
      let e = seen.get(key);
      if (!e || now - e.first > windowMs) e = { count: 0, first: now, until: 0 };
      e.count += 1;
      if (e.count >= max) { e.until = now + lockMs; e.count = 0; e.first = now; }
      seen.set(key, e);
      if (seen.size > 5000) seen.clear();
    },
    reset(key) { seen.delete(key); },
    // The counts that still matter, as plain data to save. Old and expired ones are left out.
    dump(now = Date.now()) {
      return [...seen].filter(([, e]) => (e.until && e.until > now) || now - e.first <= windowMs);
    },
  };
}

module.exports = { hashPassword, verifyPassword, DUMMY_HASH, sign, verify, randomToken, readCookie, createLimiter };
