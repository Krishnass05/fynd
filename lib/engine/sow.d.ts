import type { CompareItem, SowItem } from '../types';

export function parseSow(text: string): { items: SowItem[]; ratePerHour: number | null };
export function compareSow(baseline: SowItem[], amended: SowItem[]): CompareItem[];
