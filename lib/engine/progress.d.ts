// Type surface of progress.js. OWNER: Krishna.
export type WorkStatus = 'todo' | 'in_progress' | 'done' | 'approved';
export const STATUSES: readonly WorkStatus[];
export const WARN_AFTER_DAYS: number;
export class MoveError extends Error {}
export function checkMove(from: WorkStatus, to: string, by: 'client' | 'freelancer', note?: string): 'started' | 'done' | 'approved' | 'sent_back';
export interface Progress {
  approvedHours: number;
  doneHours: number; // done or approved
  totalHours: number; // known hours only
  percent: number | null; // approved / total, one decimal; null when no task has hours
  unknownHoursCount: number;
  approvedCount: number;
  totalCount: number;
}
export function computeProgress(items: Array<{ hours: number | null; status: WorkStatus }>): Progress;
export function istDay(t: string | Date): string;
export interface CheckinStatus {
  today: string;
  last: string | null;
  daysSince: number;
  checkedInToday: boolean;
  warn: boolean;
  warnAfterDays: number;
}
export function checkinStatus(days: string[], since: string, now: string | Date, active?: boolean): CheckinStatus;
