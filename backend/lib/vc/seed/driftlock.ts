// Synthetic demo company with three deliberately planted contradictions:
//   1. Slide 4 claims $400k ARR while slide 5's own cohort table implies ~$180k.
//   2. Slide 6 claims "ex-Google engineer" while the company site lists a
//      contractor engagement.
//   3. Slide 7 claims a $50B TAM where a bottom-up computation lands near $750M.
// Every artifact seeded here is flagged synthetic:true and rendered as such.

export interface DeckSlide {
  slide: number;
  title: string;
  text: string;
}

export const DRIFTLOCK_DECK: DeckSlide[] = [
  {
    slide: 1,
    title: 'Driftlock AI',
    text: 'Driftlock AI — reliability observability for LLM pipelines. Founded January 2026. Berlin, Germany.',
  },
  {
    slide: 2,
    title: 'Problem',
    text: 'Enterprises ship LLM features blind. Silent model drift breaks production workflows, and support teams burn thousands of hours a quarter triaging regressions nobody detected.',
  },
  {
    slide: 3,
    title: 'Product',
    text: 'Drift detection SDK plus dashboard, installed in CI. Proprietary drift-detection models score every deployment against a behavioral baseline.',
  },
  {
    slide: 4,
    title: 'Traction',
    text: 'Traction: $400k ARR across 11 design partners as of June 2026. Growing 22% month over month.',
  },
  {
    slide: 5,
    title: 'Revenue cohorts',
    text: 'Monthly recurring revenue by signup cohort, June 2026: January cohort $4,200; February cohort $2,100; March cohort $3,400; April cohort $2,200; May cohort $1,800; June cohort $1,300. Total MRR $15,000.',
  },
  {
    slide: 6,
    title: 'Team',
    text: 'Maya Chen, CTO — ex-Google engineer, six years on large-scale ML infrastructure. Jonas Petrov, CEO — second-time founder, previously built a developer-tools startup.',
  },
  {
    slide: 7,
    title: 'Market',
    text: 'TAM: $50B AI observability market by 2028.',
  },
  {
    slide: 8,
    title: 'Ask',
    text: 'Raising $1.5M pre-seed for 18 months of runway. Target close: September 2026.',
  },
];

export const DRIFTLOCK_SITE = `driftlock.ai — website snapshot

[/] Driftlock AI. Catch LLM drift before your customers do. Drift detection for production LLM pipelines.

[/team] Team.
Jonas Petrov — CEO and co-founder. Previously founded Pipewrench (developer tooling, wound down 2024).
Maya Chen — CTO and co-founder. Previously a contract software engineer at Google (2021–2023, via TekSystems staffing), working on internal ML tooling.

[/pricing] Pricing.
Design partner program: free six-month pilots for the first 15 teams. Paid plans launch Q4 2026.
`;

export function deckAsText(): string {
  return DRIFTLOCK_DECK.map((s) => `[slide ${s.slide}] ${s.title}\n${s.text}`).join('\n\n');
}
