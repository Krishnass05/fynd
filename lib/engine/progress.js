'use strict';
// Work progress and daily check-ins (docs/SCOPE_FLOW.md section 2, decision D-76). No dependencies. OWNER: Krishna.
//  - A task moves: to do -> in progress -> done (the freelancer) -> approved (the client). The client can send a done
//    task back to in progress, with a reason.
//  - Progress = approved hours / all known hours. Tasks with unknown hours are counted apart, never as zero.
//  - Check-ins: the freelancer posts one a day (India time). The client is warned after 2 days without one.

const STATUSES = Object.freeze(['todo', 'in_progress', 'done', 'approved']);
const NAME = { todo: 'to do', in_progress: 'in progress', done: 'done', approved: 'approved' };
const WARN_AFTER_DAYS = 2;
const IST_OFFSET_MS = 330 * 60_000; // India is UTC+5:30, no daylight saving

class MoveError extends Error {
  constructor(message) { super(message); this.name = 'MoveError'; }
}

// Who may move a task from one status to another. Returns the action name, or throws a MoveError with a reason.
const MOVES = {
  'todo>in_progress': { by: 'freelancer', action: 'started' },
  'todo>done': { by: 'freelancer', action: 'done' },
  'in_progress>done': { by: 'freelancer', action: 'done' },
  'done>approved': { by: 'client', action: 'approved' },
  'done>in_progress': { by: 'client', action: 'sent_back', needsNote: true },
};

function checkMove(from, to, by, note) {
  if (!STATUSES.includes(to)) throw new MoveError(`Unknown status: ${to}`);
  if (from === to) throw new MoveError(`It is already ${NAME[to]}`);
  const m = MOVES[`${from}>${to}`];
  if (!m) {
    if (from === 'approved') throw new MoveError('It is already approved');
    throw new MoveError(`A task cannot go from ${NAME[from]} to ${NAME[to]}`);
  }
  if (m.by !== by) {
    throw new MoveError(m.by === 'client' ? 'Only the client approves a task or sends it back' : 'Only the freelancer starts a task or marks it done');
  }
  if (m.needsNote && !(typeof note === 'string' && note.trim())) throw new MoveError('Say what still needs doing');
  return m.action;
}

// items: [{ hours: number|null, status }]
function computeProgress(items) {
  let totalHours = 0; let approvedHours = 0; let doneHours = 0; let unknown = 0; let approved = 0;
  for (const it of items) {
    if (it.status === 'approved') approved += 1;
    if (it.hours === null || it.hours === undefined) { unknown += 1; continue; }
    totalHours += it.hours;
    if (it.status === 'approved') approvedHours += it.hours;
    if (it.status === 'done' || it.status === 'approved') doneHours += it.hours;
  }
  return {
    approvedHours, doneHours, totalHours,
    percent: totalHours > 0 ? Math.round((approvedHours / totalHours) * 1000) / 10 : null, // one decimal
    unknownHoursCount: unknown,
    approvedCount: approved,
    totalCount: items.length,
  };
}

// The calendar day in India for a time (ISO string or Date), as YYYY-MM-DD.
function istDay(t) {
  const ms = (t instanceof Date ? t : new Date(t)).getTime();
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

const dayGap = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

// days: the IST days with a check-in; since: when work started (ISO); now: the current time (ISO or Date).
// active: false when there is nothing left to work on (then there is no warning).
function checkinStatus(days, since, now, active = true) {
  const today = istDay(now);
  const last = days.length ? [...days].sort().at(-1) : null;
  const from = last ?? istDay(since);
  const daysSince = Math.max(0, dayGap(from, today));
  return { today, last, daysSince, checkedInToday: last === today, warn: active && daysSince >= WARN_AFTER_DAYS, warnAfterDays: WARN_AFTER_DAYS };
}

module.exports = { STATUSES, WARN_AFTER_DAYS, MoveError, checkMove, computeProgress, istDay, checkinStatus };
