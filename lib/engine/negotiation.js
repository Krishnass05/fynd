'use strict';
// Negotiation: the client and the freelancer go back and forth on hours, price and date until one side accepts
// the other side's latest offer, or someone declines. One mechanism, used when hiring, on SOW rows and on every new
// task (docs/SCOPE_FLOW.md, decision D-76). Nothing is committed until both sides agree. No dependencies.
// Rule from the case data: null means "unknown", never zero, so an offer with unknown hours has no price and
// cannot be accepted. OWNER: Krishna.

const { ValidationError, ConflictError, RUSH_MULTIPLIER } = require('./scopeDesk.js');

const PARTIES = Object.freeze(['client', 'freelancer']);
const KINDS = Object.freeze(['hire', 'sow_row', 'task']);
const STATUS = Object.freeze({ OPEN: 'open', AGREED: 'agreed', DECLINED: 'declined' });
const MAX_OFFERS = 20; // a negotiation that has not settled after 20 offers needs a conversation, not more offers
const MAX_HOURS = 10_000;

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const other = (party) => (party === 'client' ? 'freelancer' : 'client');

function checkParty(by) {
  if (!PARTIES.includes(by)) throw new ValidationError('by must be client or freelancer');
}

function checkDate(due) {
  if (due === null || due === undefined) return null;
  if (typeof due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(`${due}T00:00:00Z`))) {
    throw new ValidationError('due must be a date like 2026-11-30');
  }
  // Date.parse accepts 2026-02-31; make sure the day really exists
  if (new Date(`${due}T00:00:00Z`).toISOString().slice(0, 10) !== due) throw new ValidationError('due is not a real date');
  return due;
}

// Turns what someone typed into a clean offer, with the price worked out. Two ways to price:
//   hours x rate (plus the rush fee when urgent), or a fixed price (hours then optional, for information).
function makeOffer(input) {
  if (!input || typeof input !== 'object') throw new ValidationError('An offer is required');
  const hours = input.hours === undefined ? null : input.hours;
  if (hours !== null && (!isNum(hours) || hours < 0 || hours > MAX_HOURS)) throw new ValidationError(`hours must be a number from 0 to ${MAX_HOURS}, or null when unknown`);
  const rate = input.ratePerHour === undefined ? null : input.ratePerHour;
  if (rate !== null && (!isNum(rate) || rate <= 0)) throw new ValidationError('ratePerHour must be a positive number');
  const fixed = input.price === undefined ? null : input.price;
  if (fixed !== null && (!isNum(fixed) || fixed < 0 || !Number.isInteger(fixed))) throw new ValidationError('price must be a whole number of rupees, 0 or more');
  if (fixed !== null && rate !== null) throw new ValidationError('Give either a rate per hour or a fixed price, not both');
  const rush = input.rush === true;
  if (rush && fixed !== null) throw new ValidationError('A rush fee applies to hours x rate, not to a fixed price');
  const note = input.note === undefined || input.note === null ? '' : input.note;
  if (typeof note !== 'string' || note.length > 1000) throw new ValidationError('note must be text of at most 1000 characters');

  let price = null; // null = no price yet (unknown hours or no rate)
  let basis = 'unknown';
  if (fixed !== null) { price = fixed; basis = 'fixed'; }
  else if (hours !== null && rate !== null) {
    price = Math.round(hours * rate * (rush ? RUSH_MULTIPLIER : 1));
    basis = 'hours_x_rate';
  }
  return {
    hours, ratePerHour: rate, rush, price, basis, due: checkDate(input.due), note: note.trim(),
    beforeTax: true,
    assumptions: rush ? [`Rush fee: x${RUSH_MULTIPLIER} (assumption, not observed data)`] : [],
  };
}

class Negotiations {
  // now: a function returning an ISO time (injectable for tests)
  constructor({ now = () => new Date().toISOString() } = {}) {
    this.now = now;
    this.items = new Map();
    this.seq = 0;
  }

  // Starts a negotiation with a first offer. The subject says what is being negotiated: { kind, ref }, for example
  // { kind: 'task', ref: 'P1:blog page' }. If one is already open or agreed for the same subject, that one is returned
  // and nothing new is made (the same request twice does not double-book or double-charge).
  open(subject, by, offerInput) {
    if (!subject || !KINDS.includes(subject.kind)) throw new ValidationError(`subject.kind must be one of ${KINDS.join(', ')}`);
    if (typeof subject.ref !== 'string' || !subject.ref.trim()) throw new ValidationError('subject.ref is required');
    checkParty(by);
    const offer = makeOffer(offerInput);
    const key = `${subject.kind}:${subject.ref.trim().toLowerCase()}`;
    const existing = [...this.items.values()].find((n) => n.key === key && n.status !== STATUS.DECLINED);
    if (existing) {
      this.log(existing, by, 'repeat_ignored', null, 'Already being negotiated or agreed; the repeat was ignored');
      return { negotiation: this.view(existing.id), created: false };
    }
    this.seq += 1;
    const n = {
      id: `N${this.seq}`, key, subject: { kind: subject.kind, ref: subject.ref.trim() }, status: STATUS.OPEN,
      offers: [], agreed: null, closedBy: null, closedReason: null, events: [],
    };
    this.items.set(n.id, n);
    this.addOffer(n, by, offer, 'opened');
    return { negotiation: this.view(n.id), created: true };
  }

  // A new offer in answer to the other side's latest one.
  counter(id, by, offerInput) {
    const n = this.openOne(id);
    checkParty(by);
    const last = n.offers[n.offers.length - 1];
    if (last.by === by) throw new ConflictError(`Waiting for the ${other(by)} to answer your offer`);
    if (n.offers.length >= MAX_OFFERS) throw new ConflictError(`No agreement after ${MAX_OFFERS} offers. Talk it through, then accept or decline`);
    this.addOffer(n, by, makeOffer(offerInput), 'countered');
    return this.view(id);
  }

  // Accepts the other side's latest offer. That offer becomes the agreed record.
  accept(id, by) {
    const n = this.get(id);
    checkParty(by);
    if (n.status === STATUS.AGREED) throw new ConflictError('Already agreed');
    if (n.status === STATUS.DECLINED) throw new ConflictError('This was declined. Start a new offer instead');
    const last = n.offers[n.offers.length - 1];
    if (last.by === by) throw new ConflictError('You cannot accept your own offer. The other side has to accept it');
    if (last.price === null) throw new ConflictError('This offer has no price yet (hours unknown). Counter with hours before accepting');
    n.status = STATUS.AGREED;
    n.agreed = { ...last, acceptedBy: by, acceptedAt: this.now() };
    n.closedBy = by;
    this.log(n, by, 'accepted', last.n);
    return this.view(id);
  }

  // Either side can decline (the side that made the offer can withdraw it the same way). A reason is required.
  decline(id, by, reason) {
    const n = this.openOne(id);
    checkParty(by);
    if (typeof reason !== 'string' || !reason.trim()) throw new ValidationError('Say why you are declining');
    n.status = STATUS.DECLINED;
    n.closedBy = by;
    n.closedReason = reason.trim().slice(0, 500);
    this.log(n, by, 'declined', null, n.closedReason);
    return this.view(id);
  }

  // ---- reading ----
  get(id) {
    const n = this.items.get(id);
    if (!n) throw new ValidationError(`Unknown negotiation: ${id}`);
    return n;
  }

  view(id) {
    const n = this.get(id);
    const latest = n.offers[n.offers.length - 1];
    const waitingFor = n.status === STATUS.OPEN ? other(latest.by) : null;
    return JSON.parse(JSON.stringify({
      id: n.id, subject: n.subject, status: n.status, offers: n.offers, latest, agreed: n.agreed,
      waitingFor, canAccept: waitingFor !== null && latest.price !== null, closedBy: n.closedBy, closedReason: n.closedReason,
      events: n.events,
    }));
  }

  list(filter = {}) {
    return [...this.items.values()]
      .filter((n) => (!filter.kind || n.subject.kind === filter.kind) && (!filter.refPrefix || n.subject.ref.startsWith(filter.refPrefix)))
      .map((n) => this.view(n.id));
  }

  // What both sides have agreed, in total. Open and declined negotiations never count.
  committed(filter = {}) {
    const agreed = this.list(filter).filter((n) => n.status === STATUS.AGREED);
    return {
      count: agreed.length,
      price: agreed.reduce((s, n) => s + n.agreed.price, 0),
      hours: agreed.reduce((s, n) => s + (n.agreed.hours ?? 0), 0),
      unknownHours: agreed.filter((n) => n.agreed.hours === null).length, // fixed-price items with no hours given
      beforeTax: true,
    };
  }

  // ---- saving ----
  toState() {
    return { seq: this.seq, items: [...this.items.values()] };
  }

  static fromState(state, opts) {
    const book = new Negotiations(opts);
    if (state && typeof state === 'object') {
      book.seq = isNum(state.seq) ? state.seq : 0;
      for (const n of Array.isArray(state.items) ? state.items : []) book.items.set(n.id, n);
    }
    return book;
  }

  // ---- inside ----
  openOne(id) {
    const n = this.get(id);
    if (n.status !== STATUS.OPEN) throw new ConflictError(n.status === STATUS.AGREED ? 'Already agreed' : 'This was declined. Start a new offer instead');
    return n;
  }

  addOffer(n, by, offer, action) {
    const o = { n: n.offers.length + 1, by, at: this.now(), ...offer };
    n.offers.push(o);
    this.log(n, by, action, o.n);
  }

  log(n, by, action, offerN, detail) {
    n.events.push({ at: this.now(), by, action, offer: offerN, ...(detail ? { detail } : {}) });
  }
}

module.exports = { Negotiations, makeOffer, STATUS, KINDS, PARTIES, MAX_OFFERS };
