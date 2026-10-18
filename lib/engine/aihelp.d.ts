import type { AiOptions } from './aiguard';

export function ask(question: string, role?: string, options?: AiOptions): Promise<string | null>;
export function systemPrompt(role?: string): string;
