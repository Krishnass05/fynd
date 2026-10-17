'use strict';
// Zero-dependency server: serves public/ and exposes the rules engine as a JSON API.
// Run: npm start  ->  http://localhost:3000

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const fixture = require('./fixture.json');
const { ScopeDesk, ValidationError, ConflictError } = require('./scopeDesk.js');
const { requestsCsv, auditCsv } = require('./exporter.js');
const { runDemo } = require('./demo.js');

const PUBLIC = path.join(__dirname, 'public');
const SAVE_FILE = path.join(__dirname, 'data', 'latest.json');
const MAX_BODY = 1_000_000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function createApp({ saveFile = SAVE_FILE } = {}) {
  let desk = ScopeDesk.fromFixture(fixture);

  const save = () => {
    if (!saveFile) return;
    try {
      fs.mkdirSync(path.dirname(saveFile), { recursive: true });
      fs.writeFileSync(saveFile, JSON.stringify(desk.snapshot(), null, 2));
    } catch (e) {
      console.error('could not save snapshot:', e.message);
    }
  };

  const readJson = (req) => new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new ValidationError('request body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text.trim()) return resolve({});
      try { resolve(JSON.parse(text)); } catch { reject(new ValidationError('body is not valid JSON')); }
    });
    req.on('error', reject);
  });

  const send = (res, status, body, type = 'application/json; charset=utf-8', extra = {}) => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra });
    res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
  };

  const fail = (res, e) => {
    if (e instanceof ValidationError) return send(res, 400, { error: e.message, type: 'validation' });
    if (e instanceof ConflictError) return send(res, 409, { error: e.message, type: 'conflict' });
    console.error(e);
    return send(res, 500, { error: 'Unexpected server error', type: 'server' });
  };

  const routes = {
    'GET /api/state': () => desk.snapshot(),
    'GET /api/fixture': () => fixture,
    'GET /api/demo': () => runDemo(),
    'POST /api/reset': () => { desk = ScopeDesk.fromFixture(fixture); save(); return desk.snapshot(); },
    'POST /api/import': (b) => {
      const list = Array.isArray(b) ? b : b.requests;
      const result = desk.importRequests(list, b.by || 'import');
      save();
      return { result, state: desk.snapshot() };
    },
    'POST /api/approve': (b) => { desk.approve(b.id, b.by); save(); return desk.snapshot(); },
    'POST /api/reject': (b) => { desk.reject(b.id, b.by, b.reason); save(); return desk.snapshot(); },
    'POST /api/reopen': (b) => { desk.reopen(b.id, b.by, b.reason); save(); return desk.snapshot(); },
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const key = `${req.method} ${url.pathname}`;

      if (key === 'GET /export/snapshot.json') {
        return send(res, 200, JSON.stringify(desk.snapshot(), null, 2), 'application/json; charset=utf-8', { 'Content-Disposition': 'attachment; filename="scope-desk-snapshot.json"' });
      }
      if (key === 'GET /export/requests.csv') {
        return send(res, 200, requestsCsv(desk.snapshot()), 'text/csv; charset=utf-8', { 'Content-Disposition': 'attachment; filename="requests.csv"' });
      }
      if (key === 'GET /export/audit.csv') {
        return send(res, 200, auditCsv(desk.snapshot()), 'text/csv; charset=utf-8', { 'Content-Disposition': 'attachment; filename="audit.csv"' });
      }

      if (url.pathname.startsWith('/api/')) {
        const handler = routes[key];
        if (!handler) return send(res, 404, { error: 'Not found', type: 'not_found' });
        const body = req.method === 'POST' ? await readJson(req) : {};
        return send(res, 200, handler(body));
      }

      if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
      const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const file = path.resolve(PUBLIC, rel);
      if (!file.startsWith(PUBLIC + path.sep) || !TYPES[path.extname(file)]) return send(res, 404, 'Not found', 'text/plain');
      fs.readFile(file, (err, data) => {
        if (err) return send(res, 404, 'Not found', 'text/plain');
        send(res, 200, data, TYPES[path.extname(file)]);
      });
    } catch (e) {
      fail(res, e);
    }
  });

  return { server, getDesk: () => desk };
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createApp().server.listen(port, () => console.log(`Scope Change Desk running at http://localhost:${port}`));
}

module.exports = { createApp };
