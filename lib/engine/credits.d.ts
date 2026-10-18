// Type surface of credits.js. OWNER: Krishna.
export const START_CREDITS: number;
export const CALL_COST: number;
export const PRICE_PER_CREDIT: number;
export interface CreditPack { id: string; credits: number; price: number; label: string; popular?: boolean }
export const PACKS: readonly CreditPack[];
export class CreditError extends Error {}
export function balanceOf(stored: number | null | undefined): number;
export function canCall(stored: number | null | undefined): boolean;
export function chargeCall(stored: number | null | undefined): number;
export function buyPack(stored: number | null | undefined, packId: string): { balance: number; pack: CreditPack };
