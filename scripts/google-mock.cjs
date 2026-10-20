// A pretend Google for testing the sign-in flow without a real Google client id. Used by scripts/google-check.mjs.
// It knows three codes: "good-new" (a new person), "good-existing" (the email of an account made with a password),
// and "unverified" (an email Google has not verified). A code works once.
const http = require('http');
const used = new Set();
const PROFILES = {
  'good-new': { sub: 'g-111', email: 'new.person@gmail.com', email_verified: true, name: 'New Person' },
  'good-existing': { sub: 'g-222', email: 'existing.user@example.com', email_verified: true, name: 'Existing User' },
  'good-new-2': { sub: 'g-111', email: 'new.person@gmail.com', email_verified: true, name: 'New Person' },
  'good-next': { sub: 'g-222', email: 'existing.user@example.com', email_verified: true, name: 'Existing User' },
  unverified: { sub: 'g-333', email: 'sneaky@gmail.com', email_verified: false, name: 'Sneaky' },
};
http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => (body += d));
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    if (req.url.startsWith('/token')) {
      const p = new URLSearchParams(body);
      const code = p.get('code');
      if (p.get('client_id') !== 'test-id' || p.get('client_secret') !== 'test-secret' || p.get('grant_type') !== 'authorization_code') { res.statusCode = 401; return res.end('{}'); }
      if (!PROFILES[code] || used.has(code)) { res.statusCode = 400; return res.end('{"error":"invalid_grant"}'); }
      used.add(code);
      return res.end(JSON.stringify({ access_token: 'token-for-' + code }));
    }
    if (req.url.startsWith('/userinfo')) {
      const t = (req.headers.authorization || '').replace('Bearer token-for-', '');
      if (!PROFILES[t]) { res.statusCode = 401; return res.end('{}'); }
      return res.end(JSON.stringify(PROFILES[t]));
    }
    res.statusCode = 404; res.end('{}');
  });
}).listen(4020, () => console.log('pretend google on 4020'));
