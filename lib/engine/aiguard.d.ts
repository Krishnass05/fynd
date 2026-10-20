export interface AiVerdict { flag: boolean; reasons: string[]; provider: string }
export interface AiOptions { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch; timeoutMs?: number }
export function review(text: string, options?: AiOptions): Promise<AiVerdict | null>;
export function status(env?: Record<string, string | undefined>): { enabled: boolean; provider: string | null };
export function config(env?: Record<string, string | undefined>): { provider: string; key: string; model: string; base: string } | null;
export function parseVerdict(raw: unknown): { flag: boolean; reasons: string[] } | null;
export const SYSTEM: string;
