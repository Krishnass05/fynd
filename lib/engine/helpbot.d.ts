export interface BotLink { label: string; href: string }
export interface BotTopic { id: string; title: string }
export interface BotReply { text: string; links: BotLink[]; topics: BotTopic[]; matched?: string }
export const GUIDE: Array<{ id: string; roles: string[]; title: string; keys: string[]; answer: string; links: BotLink[] }>;
export function answer(question: string, role?: string): BotReply;
export function answerFor(id: string): BotReply | null;
export function suggestions(role?: string): BotTopic[];
