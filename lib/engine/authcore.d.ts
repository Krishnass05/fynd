export function hashPassword(password: string): string;
export function verifyPassword(password: string, stored: string | undefined | null): boolean;
export const DUMMY_HASH: string;
export function sign(secret: string, payload: Record<string, unknown>, ttlMs: number, now?: number): string;
export function verify(secret: string, token: unknown, now?: number): (Record<string, unknown> & { exp: number }) | null;
export function randomToken(bytes?: number): string;
export function readCookie(header: string | null | undefined, name: string): string | null;
export interface Limiter { check(key: string, now?: number): number; fail(key: string, now?: number): void; reset(key: string): void; dump(now?: number): Array<[string, { count: number; first: number; until: number }]> }
export function createLimiter(opts?: { max?: number; windowMs?: number; lockMs?: number }, initial?: Array<[string, { count: number; first: number; until: number }]>): Limiter;
