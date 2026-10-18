// Keeps the app's data in Supabase (Postgres) when SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY
// are set; otherwise everything stays in memory, as in development. OWNER: Krishna.
//
// How it works (a deliberate hackathon shortcut, not a normalised schema):
//  - The whole app state is ONE versioned JSON row in the table app_state. Each request loads its own private copy
//    (db() returns that copy), and if the request changed anything it writes the copy back with
//    "update ... where version = <the version I loaded>". If someone else wrote in between, the write is refused and the
//    whole request is run again on the fresh data, so no update is lost.
//  - Call signalling (very frequent, short-lived) lives in its own table, call_signals, so calls do not rewrite the state.
//  - Talks to Supabase's REST interface with fetch, so no extra package is needed. The service key stays on the server.
import { createLimiter } from '@/lib/engine/authcore';
import { ScopeDesk } from '@/lib/engine/scopeDesk';
import { Negotiations } from '@/lib/engine/negotiation';
import type { CallSignal, CallSignalType } from '@/lib/types';
import type { RequestContext } from './context';
import { HttpError } from './errors';
import { seedDb, type Db } from './store';

function cfg() {
  // Accept the URL with or without a trailing /rest/v1/ (Supabase shows it both ways).
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key || process.env.STORE === 'memory') return null;
  // The publishable (public) key cannot write past row level security: warn and stay in memory instead of failing every request.
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_anon_')) {
    const w = globalThis as unknown as { __warnedKey?: boolean };
    if (!w.__warnedKey) { w.__warnedKey = true; console.warn('SUPABASE_SERVICE_ROLE_KEY is a publishable key. Use the SECRET key (sb_secret_...). Data stays in memory until then.'); }
    return null;
  }
  return { url, key };
}

export const persistent = (): boolean => cfg() !== null;

async function rest(path: string, init: RequestInit & { prefer?: string } = {}, ms = 8000): Promise<unknown> {
  const c = cfg();
  if (!c) throw new Error('Supabase is not configured');
  const { prefer, ...rest } = init;
  const headers: Record<string, string> = { apikey: c.key, 'content-type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) };
  // Legacy service_role keys are JWTs and go in Authorization too; the newer sb_secret_ keys use the apikey header only.
  if (c.key.startsWith('eyJ')) headers.Authorization = `Bearer ${c.key}`;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(`${c.url}/rest/v1/${path}`, { ...rest, headers, signal: ctl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(t);
  }
}

// ---- turning the in-memory data into plain JSON and back ----
export function serializeDb(d: Db): unknown {
  return {
    users: d.users, jobs: d.jobs, applications: d.applications, projects: d.projects, sow: d.sow, messages: d.messages, milestones: d.milestones, seq: d.seq,
    credentials: [...d.credentials], googleIds: [...d.googleIds], limiter: d.limiter.dump(),
    saved: [...d.saved].map(([k, v]) => [k, [...v]]),
    desks: [...d.desks].map(([k, v]) => [k, v.toState()]),
    labels: [...d.labels], hashes: [...d.hashes],
    tasks: d.tasks, deals: [...d.deals].map(([k, v]) => [k, v.toState()]),
  };
}

export function deserializeDb(o: Record<string, unknown>): Db {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    users: arr(o.users), jobs: arr(o.jobs), applications: arr(o.applications), projects: arr(o.projects), sow: arr(o.sow), messages: arr(o.messages), milestones: arr(o.milestones),
    signals: [], // call signals are in their own table
    credentials: new Map(arr<[string, string]>(o.credentials)),
    googleIds: new Map(arr<[string, string]>(o.googleIds)),
    limiter: createLimiter({}, arr(o.limiter)), // saved too, so a lockout holds across servers and restarts
    saved: new Map(arr<[string, string[]]>(o.saved).map(([k, v]) => [k, new Set(v)] as [string, Set<string>])),
    desks: new Map(arr<[string, unknown]>(o.desks).map(([k, v]) => [k, ScopeDesk.fromState(v)] as [string, ScopeDesk])),
    labels: new Map(arr(o.labels)),
    hashes: new Map(arr(o.hashes)),
    // added with the new-task flow: older saved data has none, which reads as empty
    tasks: arr(o.tasks),
    deals: new Map(arr<[string, unknown]>(o.deals).map(([k, v]) => [k, Negotiations.fromState(v)] as [string, Negotiations])),
    seq: typeof o.seq === 'number' ? o.seq : 100,
  };
}

// ---- the state row ----
const g = globalThis as unknown as { __persistCache?: { version: number; json: string } };

async function saveJson(json: string, expected: number): Promise<number | null> {
  const rows = (await rest(`app_state?id=eq.${'main'}&version=eq.${expected}`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: `{"data":${json},"version":${expected + 1},"updated_at":${JSON.stringify(new Date().toISOString())}}`,
  })) as Array<{ version: number }> | null;
  if (!rows || rows.length !== 1) return null; // someone else saved first
  g.__persistCache = { version: expected + 1, json };
  return expected + 1;
}

async function loadState(): Promise<{ db: Db; version: number; json: string }> {
  for (let tries = 0; tries < 3; tries += 1) {
    let head = (await rest('app_state?id=eq.main&select=version')) as Array<{ version: number }> | null;
    if (!head || head.length === 0) {
      await rest('app_state', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: JSON.stringify({ id: 'main', version: 0 }) });
      head = (await rest('app_state?id=eq.main&select=version')) as Array<{ version: number }>;
    }
    const version = head[0].version;
    let json = g.__persistCache && g.__persistCache.version === version ? g.__persistCache.json : null;
    if (json === null) {
      const rows = (await rest('app_state?id=eq.main&select=version,data')) as Array<{ version: number; data: unknown }>;
      if (!rows[0] || rows[0].version !== version) continue; // it moved on while we were reading: try again
      if (rows[0].data === null || rows[0].data === undefined) {
        // First ever request: put the demo data in.
        const seeded = JSON.stringify(serializeDb(seedDb()));
        if ((await saveJson(seeded, version)) === null) continue;
        return { db: deserializeDb(JSON.parse(seeded)), version: version + 1, json: seeded };
      }
      json = JSON.stringify(rows[0].data);
      g.__persistCache = { version, json };
    }
    return { db: deserializeDb(JSON.parse(json)), version, json };
  }
  throw new HttpError(503, 'server', 'The data store is busy. Please try again.');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Runs one request against its own copy of the data. Reads just load it. Writes save it back if it changed, and if
// someone else saved in the meantime the whole request is run again on fresh data.
export async function withState<T>(ctx: RequestContext, work: () => Promise<T>, write: boolean): Promise<T> {
  if (!persistent()) return work();
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const { db, version, json } = await loadState();
    ctx.db = db;
    ctx.cookies.length = 0; // a retried request starts clean
    let result: T;
    try {
      result = await work();
    } catch (e) {
      // Some failures must still be remembered (a wrong password counts towards the lockout): save once, then fail as before.
      if (write && ctx.saveOnError && ctx.db) {
        const now = JSON.stringify(serializeDb(ctx.db));
        if (now !== json) await saveJson(now, version).catch(() => null);
      }
      throw e;
    }
    if (!write || !ctx.db) return result;
    const now = JSON.stringify(serializeDb(ctx.db));
    if (now === json) return result; // nothing changed: no write
    if ((await saveJson(now, version)) !== null) return result;
    await sleep(Math.floor(Math.random() * 30 * (attempt + 1)) + 10);
  }
  throw new HttpError(503, 'server', 'The server is busy. Please try again.');
}

// ---- call signals (own table) ----
interface SignalRow { seq: number; project_id: string; from_user: string; to_user: string; type: CallSignalType; payload: string; at: string }
const toSignal = (r: SignalRow): CallSignal => ({ id: `SIG${r.seq}`, seq: r.seq, projectId: r.project_id, fromUserId: r.from_user, toUserId: r.to_user, type: r.type, payload: r.payload, at: r.at });

export async function insertSignal(row: { project_id: string; from_user: string; to_user: string; type: CallSignalType; payload: string }): Promise<CallSignal> {
  const rows = (await rest('call_signals', { method: 'POST', prefer: 'return=representation', body: JSON.stringify(row) })) as SignalRow[];
  if (Math.random() < 0.02) { // now and then, tidy away signals older than an hour
    const cutoff = new Date(Date.now() - 3600_000).toISOString();
    void rest(`call_signals?at=lt.${encodeURIComponent(cutoff)}`, { method: 'DELETE' }).catch(() => undefined);
  }
  return toSignal(rows[0]);
}

export async function signalsSince(projectId: string, toUser: string, since: number): Promise<CallSignal[]> {
  const rows = (await rest(`call_signals?project_id=eq.${encodeURIComponent(projectId)}&to_user=eq.${encodeURIComponent(toUser)}&seq=gt.${Math.max(0, Math.floor(since))}&order=seq.asc&limit=200&select=*`)) as SignalRow[];
  return rows.map(toSignal);
}

export async function clearSignals(): Promise<void> {
  await rest('call_signals?seq=gt.0', { method: 'DELETE' });
}
