'use strict';
// Call credits for clients. Freelancers never pay. Every client starts with START_CREDITS; a call costs
// CALL_COST credit when it is answered (a missed or declined call is free); when credits run out the client buys
// a pack. Pack prices are proposals (assumptions) to confirm with the business side. No dependencies. OWNER: Krishna.

const START_CREDITS = 10;
const CALL_COST = 1;

// Credit packs a client can buy: ₹20 per credit (one credit = one answered call). Prices in rupees, before GST.
// Edit here; the wallet in the top bar and the Credits page both read this list.
const PRICE_PER_CREDIT = 20;
const PACKS = Object.freeze([1, 5, 10, 25].map((n) => ({ id: 'c' + n, credits: n, price: n * PRICE_PER_CREDIT, label: n === 1 ? '1 credit' : n + ' credits' })));

class CreditError extends Error {
  constructor(message) { super(message); this.name = 'CreditError'; }
}

// A client's balance: unknown (an account from before credits existed) means the starting amount.
const balanceOf = (stored) => (typeof stored === 'number' && Number.isFinite(stored) ? stored : START_CREDITS);

const canCall = (stored) => balanceOf(stored) >= CALL_COST;

// The balance after charging one call. Refuses when there are not enough credits.
function chargeCall(stored) {
  const b = balanceOf(stored);
  if (b < CALL_COST) throw new CreditError('No call credits left. Buy credits to call.');
  return b - CALL_COST;
}

// The balance after buying a pack, and the pack bought.
function buyPack(stored, packId) {
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) throw new CreditError('Unknown credit pack');
  return { balance: balanceOf(stored) + pack.credits, pack };
}

module.exports = { START_CREDITS, CALL_COST, PRICE_PER_CREDIT, PACKS, CreditError, balanceOf, canCall, chargeCall, buyPack };
