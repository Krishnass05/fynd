// What a request carries: which side it acts as (x-demo-role), the signed-in user from the session cookie, and any
// cookies the handler wants set on the response. run() fills it in and actor() reads it. OWNER: Krishna.
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Db } from './store';

export interface CookieSpec {
  name: string;
  value: string;
  options: { httpOnly?: boolean; sameSite?: 'lax' | 'strict'; path?: string; secure?: boolean; maxAge?: number };
}
export interface RequestContext { role: string | null; sessionUserId: string | null; cookies: CookieSpec[]; origin: string; ip: string; db?: Db; saveOnError?: boolean }

export const requestRole = new AsyncLocalStorage<RequestContext>();
