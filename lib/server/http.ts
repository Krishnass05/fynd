import { NextResponse } from 'next/server';
import { HttpError, bad } from './errors';
import { requestRole, type RequestContext } from './context';
import { SESSION_COOKIE, userFromCookie } from './session';
import { readCookie } from '@/lib/engine/authcore';

const MAX_BODY = 2_000_000;

export interface Ctx {
  userId: string | null;
  body: Record<string, unknown>;
  url: URL;
}

// Every API route goes through this: parses the body, finds the demo user, and turns any
// failure into a clear JSON message instead of a crash.
export async function run(req: Request, fn: (ctx: Ctx) => unknown | Promise<unknown>) {
  try {
    const url = new URL(req.url);
    let body: Record<string, unknown> = {};
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const text = await req.text();
      if (text.length > MAX_BODY) throw bad('Request body is too large');
      if (text.trim()) {
        try {
          const parsed: unknown = JSON.parse(text);
          if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
          body = parsed as Record<string, unknown>;
        } catch {
          throw bad('Body is not valid JSON');
        }
      }
    }
    const ctx: RequestContext = {
      role: req.headers.get('x-demo-role'),
      sessionUserId: userFromCookie(readCookie(req.headers.get('cookie'), SESSION_COOKIE)),
      cookies: [],
      origin: process.env.APP_URL?.replace(/\/$/, '') || url.origin,
      ip: (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local',
    };
    const data = await requestRole.run(ctx, async () => fn({ userId: req.headers.get('x-demo-user'), body, url }));
    const res = NextResponse.json(data);
    for (const c of ctx.cookies) res.cookies.set(c.name, c.value, c.options);
    return res;
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message, type: e.type, ...(e.fields ? { fields: e.fields } : {}) }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: 'Unexpected server error', type: 'server' }, { status: 500 });
  }
}
