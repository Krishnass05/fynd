'use strict';
// Scope Change Desk rules engine. No dependencies. The UI only calls this module.
// Rule from the case data: null means "unknown", never zero.

const crypto = require('node:crypto');

class ValidationError extends Error {
  constructor(message) { super(message); this.name = 'ValidationError'; }
}
class ConflictError extends Error {
  constructor(message) { super(message); this.name = 'ConflictError'; }
}

const STATES = Object.freeze({
  NEEDS_CLARIFICATION: 'needs_clarification',
  QUOTED: 'quoted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DEFECT_REWORK: 'defect_rework',
  IN_SCOPE: 'in_scope',
});

// Assumption, not observed data. Shown next to every rush estimate.
const RUSH_MULTIPLIER = 1.5;

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

function validateConfig({ scope, ratePerHour, availableHours }) {
  if (!scope || !Array.isArray(scope.included) || !Array.isArray(scope.excluded)) {
    throw new ValidationError('scope.included and scope.excluded must be arrays');
  }
  for (const item of [...scope.included, ...scope.excluded]) {
    if (typeof item !== 'string' || !item.trim()) throw new ValidationError('scope items must be non-empty strings');
  }
  if (!isNum(ratePerHour) || ratePerHour <= 0) throw new ValidationError('ratePerHour must be a positive number');
  if (!isNum(availableHours) || availableHours < 0) throw new ValidationError('availableHours must be a number >= 0');
}

function validateRequest(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) throw new ValidationError('request must be an object');
  if (typeof r.id !== 'string' || !r.id.trim()) throw new ValidationError('request is missing an id');
  if (typeof r.text !== 'string' || !r.text.trim()) throw new ValidationError(`${r.id}: text is required`);
  if (r.hours !== null && r.hours !== undefined) {
    if (!isNum(r.hours)) throw new ValidationError(`${r.id}: hours must be a number or null`);
    if (r.hours < 0) throw new ValidationError(`${r.id}: hours cannot be negative`);
  }
  if (r.urgent !== undefined && typeof r.urgent !== 'boolean') throw new ValidationError(`${r.id}: urgent must be true or false`);
  if (r.reason !== undefined && typeof r.reason !== 'string') throw new ValidationError(`${r.id}: reason must be a string`);
  if (r.classifyAs !== undefined && !['change', 'in_scope', 'defect'].includes(r.classifyAs)) throw new ValidationError(`${r.id}: classifyAs must be change, in_scope or defect`);
  return {
    id: r.id.trim(),
    text: r.text.trim(),
    hours: r.hours === undefined ? null : r.hours,
    reason: r.reason === undefined ? null : r.reason.trim(),
    urgent: r.urgent === true,
    classifyAs: r.classifyAs === undefined ? null : r.classifyAs,
  };
}

// Content hash covers what the client asked for. Status is deliberately excluded.
function contentHash(r) {
  const canon = JSON.stringify([r.id, norm(r.text), r.hours, r.reason ? norm(r.reason) : null, r.urgent, r.classifyAs]);
  return crypto.createHash('sha256').update(canon).digest('hex');
}

class ScopeDesk {
  constructor({ scope, ratePerHour, availableHours, currency = 'INR', now = () => new Date().toISOString() }) {
    validateConfig({ scope, ratePerHour, availableHours });
    this.scope = { included: [...scope.included], excluded: [...scope.excluded] };
    this.ratePerHour = ratePerHour;
    this.availableHours = availableHours;
    this.currency = currency;
    this._now = now;
    this._requests = new Map();
    this._audit = [];
  }

  static fromFixture(fixture) {
    if (!fixture || typeof fixture !== 'object') throw new ValidationError('fixture must be an object');
    const desk = new ScopeDesk({
      scope: fixture.scope,
      ratePerHour: fixture.ratePerHour,
      availableHours: fixture.availableHours,
      currency: fixture.currency || 'INR',
    });
    if (fixture.requests !== undefined) desk.importRequests(fixture.requests, 'fixture');
    return desk;
  }

  // ---- classification and estimate ----
  classify(r) {
    // The SOW comparison may already know the answer (for example a brand new item); it wins over text matching.
    if (r.classifyAs) return r.classifyAs;
    if (r.reason && norm(r.reason) === 'defect rework') return 'defect';
    const t = norm(r.text);
    if (this.scope.excluded.some((x) => t.includes(norm(x)))) return 'change';
    if (this.scope.included.some((x) => t.includes(norm(x)))) return 'in_scope';
    return 'unclear';
  }

  estimate(r) {
    if (r.hours === null) return null;
    const multiplier = r.urgent ? RUSH_MULTIPLIER : 1;
    const assumptions = [`Rate is ${this.ratePerHour} ${this.currency}/hr from the agreement`, 'Amount is before taxes'];
    if (r.urgent) assumptions.push(`Rush multiplier ${RUSH_MULTIPLIER}x is an assumption, not agreed with the client`);
    return {
      hours: r.hours,
      ratePerHour: this.ratePerHour,
      multiplier,
      amount: Math.round(r.hours * this.ratePerHour * multiplier),
      currency: this.currency,
      beforeTax: true,
      assumptions,
    };
  }

  _initialState(r) {
    switch (this.classify(r)) {
      case 'defect': return r.hours === null ? STATES.NEEDS_CLARIFICATION : STATES.DEFECT_REWORK;
      case 'in_scope': return r.hours === null ? STATES.NEEDS_CLARIFICATION : STATES.IN_SCOPE;
      case 'change': return r.hours === null ? STATES.NEEDS_CLARIFICATION : STATES.QUOTED;
      default: return STATES.NEEDS_CLARIFICATION;
    }
  }

  // ---- import (idempotent) ----
  importRequests(list, by = 'import') {
    if (!Array.isArray(list)) throw new ValidationError('requests must be an array');
    // Validate everything first so a bad row never leaves a half-imported batch.
    const clean = list.map(validateRequest);
    const seen = new Set();
    for (const r of clean) {
      if (seen.has(r.id)) throw new ValidationError(`duplicate id in batch: ${r.id}`);
      seen.add(r.id);
    }
    const result = { added: [], updated: [], ignored: [] };
    for (const r of clean) {
      const hash = contentHash(r);
      const existing = this._requests.get(r.id);
      if (!existing) {
        const rec = { ...r, hash, version: 1, state: this._initialState(r), decidedBy: null, decisionReason: null };
        this._requests.set(r.id, rec);
        this._log('imported', r.id, by, rec.version, { state: rec.state });
        result.added.push(r.id);
      } else if (existing.hash === hash) {
        this._log('import_ignored', r.id, by, existing.version, { reason: 'same content already imported' });
        result.ignored.push(r.id);
      } else {
        const voided = existing.state === STATES.APPROVED;
        Object.assign(existing, r, { hash, version: existing.version + 1, decidedBy: null, decisionReason: null });
        existing.state = this._initialState(r);
        this._log('import_updated', r.id, by, existing.version, { state: existing.state, approvalVoided: voided });
        result.updated.push(r.id);
      }
    }
    return result;
  }

  // ---- decisions ----
  _get(id) {
    const rec = this._requests.get(id);
    if (!rec) throw new ValidationError(`unknown request: ${id}`);
    return rec;
  }

  approve(id, by) {
    if (!by) throw new ValidationError('approve needs the name of the approver');
    const rec = this._get(id);
    if (rec.state === STATES.REJECTED) throw new ConflictError(`${id} was rejected; reopen it before approving`);
    if (rec.state === STATES.APPROVED) throw new ConflictError(`${id} is already approved`);
    if (rec.state !== STATES.QUOTED) throw new ConflictError(`${id} is ${rec.state} and cannot be approved`);
    const remaining = this.remainingHours();
    if (rec.hours > remaining) {
      throw new ConflictError(`${id} needs ${rec.hours}h but only ${remaining}h of capacity remain`);
    }
    rec.state = STATES.APPROVED;
    rec.decidedBy = by;
    rec.decisionReason = null;
    this._log('approved', id, by, rec.version, { hours: rec.hours, amount: this.estimate(rec).amount });
    return this._view(rec);
  }

  reject(id, by, reason) {
    if (!by) throw new ValidationError('reject needs the name of the decider');
    const rec = this._get(id);
    if (rec.state === STATES.REJECTED) throw new ConflictError(`${id} is already rejected`);
    if (rec.state !== STATES.QUOTED && rec.state !== STATES.NEEDS_CLARIFICATION) {
      throw new ConflictError(`${id} is ${rec.state} and cannot be rejected`);
    }
    rec.state = STATES.REJECTED;
    rec.decidedBy = by;
    rec.decisionReason = reason || null;
    this._log('rejected', id, by, rec.version, { reason: rec.decisionReason });
    return this._view(rec);
  }

  reopen(id, by, reason) {
    if (!by || !reason) throw new ValidationError('reopen needs a name and a reason');
    const rec = this._get(id);
    if (rec.state !== STATES.REJECTED) throw new ConflictError(`${id} is ${rec.state}; only rejected requests can be reopened`);
    rec.state = this._initialState(rec);
    rec.decidedBy = null;
    rec.decisionReason = null;
    this._log('reopened', id, by, rec.version, { reason, state: rec.state });
    return this._view(rec);
  }

  // ---- capacity ----
  committedHours() {
    let h = 0;
    for (const r of this._requests.values()) {
      if ([STATES.APPROVED, STATES.DEFECT_REWORK, STATES.IN_SCOPE].includes(r.state)) h += r.hours;
    }
    return h;
  }

  committedValue() {
    let v = 0;
    for (const r of this._requests.values()) if (r.state === STATES.APPROVED) v += this.estimate(r).amount;
    return v;
  }

  remainingHours() { return this.availableHours - this.committedHours(); }

  utilization() { return this.availableHours === 0 ? null : this.committedHours() / this.availableHours; }

  // ---- read side ----
  _view(rec) {
    const view = {
      id: rec.id, text: rec.text, hours: rec.hours, reason: rec.reason, urgent: rec.urgent,
      version: rec.version, state: rec.state, classification: this.classify(rec),
      estimate: this.estimate(rec), decidedBy: rec.decidedBy, decisionReason: rec.decisionReason,
      warnings: [],
    };
    if (rec.state === STATES.NEEDS_CLARIFICATION) {
      view.warnings.push(rec.hours === null && this.classify(rec) !== 'unclear'
        ? 'Hours are unknown (null). Not treated as zero; re-import with an estimate.'
        : 'Request does not clearly match the agreed scope. Ask the client to clarify.');
    }
    if (rec.state === STATES.QUOTED && rec.hours > this.remainingHours()) {
      view.warnings.push(`Over capacity: needs ${rec.hours}h, ${this.remainingHours()}h remain.`);
    }
    if (rec.urgent) view.warnings.push('Urgent request: rush multiplier is an assumption.');
    if (rec.state === STATES.DEFECT_REWORK) view.warnings.push('Our own defect: booked as effort, not charged.');
    return view;
  }

  requests() { return [...this._requests.values()].map((r) => this._view(r)); }

  audit() { return this._audit.map((a) => ({ ...a, detail: { ...a.detail } })); }

  snapshot() {
    return JSON.parse(JSON.stringify({
      currency: this.currency,
      ratePerHour: this.ratePerHour,
      availableHours: this.availableHours,
      scope: this.scope,
      totals: {
        committedHours: this.committedHours(),
        remainingHours: this.remainingHours(),
        committedValue: this.committedValue(),
        utilization: this.utilization(),
        beforeTax: true,
      },
      requests: this.requests(),
      audit: this._audit,
    }));
  }

  // Saving and restoring a desk (used to keep projects in a database). The state is plain JSON.
  toState() {
    return JSON.parse(JSON.stringify({
      scope: this.scope,
      ratePerHour: this.ratePerHour,
      availableHours: this.availableHours,
      currency: this.currency,
      requests: [...this._requests.entries()],
      audit: this._audit,
    }));
  }

  static fromState(state) {
    if (!state || typeof state !== 'object') throw new ValidationError('state must be an object');
    const desk = new ScopeDesk({ scope: state.scope, ratePerHour: state.ratePerHour, availableHours: state.availableHours, currency: state.currency });
    desk._requests = new Map(Array.isArray(state.requests) ? state.requests : []);
    desk._audit = Array.isArray(state.audit) ? state.audit : [];
    return desk;
  }

  _log(action, id, by, version, detail = {}) {
    this._audit.push({ seq: this._audit.length + 1, at: this._now(), action, id, by, version, detail });
  }
}

module.exports = { ScopeDesk, ValidationError, ConflictError, STATES, RUSH_MULTIPLIER };
