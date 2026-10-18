// Pricing data shared by the landing page section and the full /pricing page. OWNER: Krishna.
// Prices are proposals being tested with small agencies (D-76 business side), not observed demand.
// Features not built in the app yet are marked `soon: true` and show a "Coming soon" tag.
export type PricingFeature = { title: string; detail: string; soon?: boolean };
export type Plan = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  per?: string;
  tokens: number;
  lead?: string;
  features: PricingFeature[];
  cta: string;
  popular?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Protect occasional, project-based work.',
    price: 'Free',
    tokens: 10,
    cta: 'Start free',
    features: [
      { title: 'AI-assisted negotiation calls', detail: 'Up to 10 minutes of secure, transcribed audio or video with clients.' },
      { title: 'Standard meeting summaries', detail: 'Automatic text highlighting the agreed deliverables.', soon: true },
      { title: 'Manual quote generation', detail: 'Basic change-order estimates from transcribed requests.' },
      { title: 'Basic workspace', detail: 'Current requests and client messages in one dashboard.' },
    ],
  },
  {
    id: 'plus',
    name: 'Business Plus',
    tagline: 'Protect margins for ongoing client work at scale.',
    price: '₹399',
    per: '/ seat / month',
    tokens: 30,
    cta: 'Choose Business Plus',
    popular: true,
    lead: 'Everything in Basic, plus:',
    features: [
      { title: 'Razorpay escrow', detail: 'Start work only after the funds are secured in escrow.', soon: true },
      { title: 'Section 10A compliant signatures', detail: 'Binding digital click-wrap approvals for every scope change.', soon: true },
      { title: 'Capacity-gated quotes', detail: 'Quotes are blocked when your team lacks the billable hours.' },
      { title: 'Immutable cloud storage', detail: 'Permanent archive of call records and contract hashes for audit trails.', soon: true },
    ],
  },
  {
    id: 'pro',
    name: 'Agency Pro',
    tagline: 'Automate financial firewalls across your entire team.',
    price: '₹699',
    per: '/ seat / month',
    tokens: 60,
    cta: 'Choose Agency Pro',
    lead: 'Everything in Business Plus, plus:',
    features: [
      { title: 'Multi-seat dashboard', detail: 'Share negotiation tokens across several project managers.', soon: true },
      { title: 'Automated MoSCoW prioritisation', detail: 'AI suggests which tasks to drop when a client adds new ones.', soon: true },
      { title: 'Centralised agency billing', detail: 'Team spend and revenue recovered, in one dashboard.', soon: true },
    ],
  },
];

// [feature, basic, plus, pro] — true = included, false = not included, string = a value shown instead
export type MatrixRow = [string, boolean | string, boolean | string, boolean | string];
export const MATRIX: Array<{ group: string; rows: MatrixRow[] }> = [
  {
    group: 'Negotiation and AI tools',
    rows: [
      ['AI call transcription and summaries', true, true, true],
      ['Monthly negotiation tokens', '10', '30', '60'],
      ['Automated MoSCoW prioritisation', false, false, true],
    ],
  },
  {
    group: 'Financial and legal protection',
    rows: [
      ['Standard change-order generation', true, true, true],
      ['Section 10A digital signatures', false, true, true],
      ['Protected payments (escrow)', false, true, true],
    ],
  },
  {
    group: 'Agency operations',
    rows: [
      ['Effort capacity vs. quote check', false, true, true],
      ['Multi-seat team access', false, false, true],
      ['Centralised billing and analytics', false, false, true],
      ['Priority dedicated support', false, false, true],
    ],
  },
];
