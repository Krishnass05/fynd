// Type surface of the plain-JS rules engine. OWNER: Krishna.
import type { AuditEntry, Estimate } from '../types';

export class ValidationError extends Error {}
export class ConflictError extends Error {}
export const STATES: Record<string, string>;

export interface EngineView {
  id: string;
  text: string;
  hours: number | null;
  reason: string | null;
  urgent: boolean;
  version: number;
  state: string;
  classification: string;
  estimate: Estimate | null;
  decidedBy: string | null;
  decisionReason: string | null;
  warnings: string[];
}

export interface ImportResult {
  added: string[];
  updated: string[];
  ignored: string[];
}

export interface EngineRequestInput {
  id: string;
  text: string;
  hours: number | null;
  reason?: string;
  urgent?: boolean;
  classifyAs?: 'change' | 'in_scope' | 'defect';
}

export class ScopeDesk {
  constructor(cfg: {
    scope: { included: string[]; excluded: string[] };
    ratePerHour: number;
    availableHours: number;
    currency?: string;
    now?: () => string;
  });
  static fromFixture(fixture: unknown): ScopeDesk;
  static fromState(state: unknown): ScopeDesk;
  toState(): unknown;
  scope: { included: string[]; excluded: string[] };
  ratePerHour: number;
  availableHours: number;
  importRequests(list: EngineRequestInput[], by?: string): ImportResult;
  approve(id: string, by: string): EngineView;
  reject(id: string, by: string, reason?: string): EngineView;
  reopen(id: string, by: string, reason: string): EngineView;
  requests(): EngineView[];
  audit(): AuditEntry[];
  committedHours(): number;
  committedValue(): number;
  remainingHours(): number;
  utilization(): number | null;
}

export const RUSH_MULTIPLIER: number;
