// A pretend Supabase (PostgREST) for testing the database layer without a Supabase project. Used by scripts/supabase-check.mjs.
// It checks the apikey, keeps one app_state row with an atomic "update where version = n", and a call_signals table.
// GET /_state shows what it holds. Start it with: node scripts/supabase-mock.cjs
const http = require('http');
const KEY = 'test-service-key';
let row = { id: 'main', version: 0, data: null, updated_at: null };
const signals = [];
let seq = 0;
const stats = { conflicts: 0, patches: 0, reads: 0 };

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let body = '';
  req.on('data', (d) => (body += d));
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    const send = (code, v) => { res.statusCode = code; res.end(v === undefined ? '' : JSON.stringify(v)); };
    if (u.pathname === '/_state') {
      return send(200, { version: row.version, hasData: row.data !== null, users: row.data ? row.data.users.length : 0, messages: row.data ? row.data.messages.length : 0, jobs: row.data ? row.data.jobs.length : 0, signals: signals.length, ...stats });
    }
    if (u.pathname === '/_data') return send(200, row.data);
    if (req.headers.apikey !== KEY) return send(401, { message: 'Invalid API key' });
    const q = (k) => { const v = u.searchParams.get(k); return v === null ? null : v; };
    const eq = (k) => { const v = q(k); return v && v.startsWith('eq.') ? v.slice(3) : null; };

    if (u.pathname === '/rest/v1/app_state') {
      if (req.method === 'GET') {
        stats.reads += 1;
        if (eq('id') !== 'main') return send(200, []);
        const sel = q('select') || '*';
        return send(200, [sel === 'version' ? { version: row.version } : { version: row.version, data: row.data }]);
      }
      if (req.method === 'POST') return send(201); // row already exists: ignore duplicates
      if (req.method === 'PATCH') {
        stats.patches += 1;
        if (eq('id') !== 'main' || String(row.version) !== eq('version')) { stats.conflicts += 1; return send(200, []); }
        const b = JSON.parse(body);
        row = { ...row, ...b };
        return send(200, [{ id: row.id, version: row.version }]);
      }
    }
    if (u.pathname === '/rest/v1/call_signals') {
      if (req.method === 'POST') {
        const b = JSON.parse(body);
        seq += 1;
        const r = { seq, project_id: b.project_id, from_user: b.from_user, to_user: b.to_user, type: b.type, payload: b.payload ?? '', at: new Date().toISOString() };
        signals.push(r);
        return send(201, [r]);
      }
      if (req.method === 'GET') {
        const gt = Number((q('seq') || 'gt.0').replace('gt.', ''));
        const out = signals.filter((s) => s.project_id === eq('project_id') && s.to_user === eq('to_user') && s.seq > gt).slice(0, Number(q('limit') || 1000));
        return send(200, out);
      }
      if (req.method === 'DELETE') {
        const at = q('at');
        const sq = q('seq');
        for (let i = signals.length - 1; i >= 0; i -= 1) {
          const x = signals[i];
          const del = (at && at.startsWith('lt.') && x.at < at.slice(3)) || (sq && sq.startsWith('gt.') && x.seq > Number(sq.slice(3)));
          if (del) signals.splice(i, 1);
        }
        return send(204);
      }
    }
    send(404, { message: 'not found' });
  });
}).listen(4030, () => console.log('pretend supabase on 4030'));
