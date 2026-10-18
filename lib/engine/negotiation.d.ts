// Type surface of the negotiation engine (negotiation.js). OWNER: Krishna.
export type Party = 'client' | 'freelancer';
export type NegotiationKind = 'hire' | 'sow_row' | 'task';
export type NegotiationStatus = 'open' | 'agreed' | 'declined';

export interface OfferInput {
  hours?: number | null; // null = unknown (then there is no price unless a fixed price is given)
  ratePerHour?: number | null; // price = hours x rate (x rush multiplier when rush)
  price?: number | null; // or a fixed price in whole rupees; not together with ratePerHour
  rush?: boolean;
  due?: string | null; // YYYY-MM-DD
  note?: string;
}

export interface Offer {
  n: number; // 1, 2, 3 ... in order
  by: Party;
  at: string;
  hours: number | null;
  ratePerHour: number | null;
  rush: boolean;
  price: number | null; // null = no price yet
  basis: 'hours_x_rate' | 'fixed' | 'unknown';
  due: string | null;
  note: string;
  beforeTax: true;
  assumptions: string[];
}

export interface NegotiationEvent {
  at: string;
  by: Party;
  action: 'opened' | 'countered' | 'accepted' | 'declined' | 'repeat_ignored';
  offer: number | null;
  detail?: string;
}

export interface NegotiationView {
  id: string;
  subject: { kind: NegotiationKind; ref: string };
  status: NegotiationStatus;
  offers: Offer[];
  latest: Offer;
  agreed: (Offer & { acceptedBy: Party; acceptedAt: string }) | null;
  waitingFor: Party | null; // who has to answer next; null once closed
  canAccept: boolean; // the waiting side can accept (the latest offer has a price)
  closedBy: Party | null;
  closedReason: string | null;
  events: NegotiationEvent[];
}

export interface Committed {
  count: number;
  price: number;
  hours: number;
  unknownHours: number;
  beforeTax: true;
}

export class Negotiations {
  constructor(opts?: { now?: () => string });
  open(subject: { kind: NegotiationKind; ref: string }, by: Party, offer: OfferInput): { negotiation: NegotiationView; created: boolean };
  counter(id: string, by: Party, offer: OfferInput): NegotiationView;
  accept(id: string, by: Party): NegotiationView;
  decline(id: string, by: Party, reason: string): NegotiationView;
  view(id: string): NegotiationView;
  list(filter?: { kind?: NegotiationKind; refPrefix?: string }): NegotiationView[];
  committed(filter?: { kind?: NegotiationKind; refPrefix?: string }): Committed;
  toState(): unknown;
  static fromState(state: unknown, opts?: { now?: () => string }): Negotiations;
}

export function makeOffer(input: OfferInput): Omit<Offer, 'n' | 'by' | 'at'>;
export const STATUS: { OPEN: 'open'; AGREED: 'agreed'; DECLINED: 'declined' };
export const KINDS: readonly NegotiationKind[];
export const PARTIES: readonly Party[];
export const MAX_OFFERS: number;
