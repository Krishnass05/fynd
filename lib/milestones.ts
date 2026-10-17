// Milestone rules shared by the server and the pages. OWNER: Krishna.
// Milestones split the agreed price. Whole rupees, before tax. Record only: no money moves.

export interface MilestoneDraft {
  title: string;
  amount: number;
}

export const MAX_MILESTONES = 10;

// A sensible starting split: 30% to start, 40% for the first delivery, the rest at the end.
// The last part takes the remainder, so the parts always add up to the price exactly.
export function defaultSplit(price: number): MilestoneDraft[] {
  const a = Math.round(price * 0.3);
  const b = Math.round(price * 0.4);
  return [
    { title: 'Kickoff', amount: a },
    { title: 'First delivery', amount: b },
    { title: 'Final delivery', amount: price - a - b },
  ];
}

// Returns an error message, or null when the split is valid.
export function checkSplit(parts: MilestoneDraft[], price: number): string | null {
  if (!parts.length) return 'Add at least one milestone';
  if (parts.length > MAX_MILESTONES) return `At most ${MAX_MILESTONES} milestones`;
  for (const p of parts) {
    if (!p.title.trim()) return 'Every milestone needs a title';
    if (p.title.trim().length > 80) return 'A milestone title is too long (maximum 80 characters)';
    if (!Number.isInteger(p.amount) || p.amount <= 0) return `"${p.title.trim()}" needs a whole-rupee amount above 0`;
  }
  const sum = parts.reduce((n, p) => n + p.amount, 0);
  if (sum !== price) return `The milestones add up to ${sum}, but the agreed price is ${price}`;
  return null;
}
