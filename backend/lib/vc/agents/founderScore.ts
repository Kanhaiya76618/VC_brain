import { append, find, id, now, where } from '../store';
import { latestAssessment } from '../cartographer';
import { latestContradictions } from './adjudicator';
import { trace } from '../trace';
import type { Claim, FounderComponent, FounderScoreEvent, FounderScoreSnapshot } from '../schema';

// The Founder Score is persistent and person-scoped: events append forever and
// follow the person across companies. It never resets. Missing public data is
// missing — the prior is a neutral 50 with low coverage, never zero.

export const FOUNDER_WEIGHTS: Record<FounderComponent, number> = {
  execution: 22,
  domain: 15,
  craft: 13,
  learning_velocity: 13,
  customer_learning: 12,
  collaboration: 10,
  integrity: 8,
  prior_outcomes: 7,
};

// Access proxies are banned as features under any name. Claims with these
// predicates never reach founder scoring or the screener LLM input.
export const BANNED_PREDICATES = [
  'school',
  'university',
  'education',
  'education_prestige',
  'employer_brand',
  'follower_count',
  'network_size',
  'network',
  'location_prestige',
  'age',
  'gender',
  'ethnicity',
  'personality',
];

export function isBannedPredicate(predicate: string): boolean {
  return BANNED_PREDICATES.some((b) => predicate === b || predicate.startsWith(`${b}_`));
}

function addEvent(
  personId: string,
  component: FounderComponent,
  delta: number,
  evidenceClaimId: string,
  note: string
): FounderScoreEvent | null {
  const dupe = find<FounderScoreEvent>(
    'founder_score_events',
    (e) => e.person_id === personId && e.component === component && e.evidence_claim_id === evidenceClaimId
  );
  if (dupe) return null;
  return append<FounderScoreEvent>('founder_score_events', {
    event_id: id('fse'),
    person_id: personId,
    component,
    delta,
    evidence_claim_id: evidenceClaimId,
    note,
    at: now(),
  });
}

// Deterministic mapping from graph evidence to score events. Every event
// carries the claim that justifies it.
export function deriveFounderEvents(personId: string, personClaims: Claim[]): FounderScoreEvent[] {
  const events: FounderScoreEvent[] = [];
  const contradictions = latestContradictions();

  for (const claim of personClaims) {
    if (isBannedPredicate(claim.predicate)) continue;
    const trust = latestAssessment(claim.claim_id)?.trust ?? null;

    if (['prior_role', 'role'].includes(claim.predicate) && trust !== null && trust >= 60) {
      const e = addEvent(personId, 'execution', 8, claim.claim_id, 'Corroborated role/execution history');
      if (e) events.push(e);
    }
    if (claim.predicate === 'prior_venture') {
      // Prior outcomes: a documented attempt is neutral-to-positive execution
      // evidence; a wound-down venture is never scored negative.
      const e = addEvent(personId, 'execution', 4, claim.claim_id, 'Documented prior venture (outcome-neutral)');
      if (e) events.push(e);
      const p = addEvent(personId, 'prior_outcomes', 0, claim.claim_id, 'Prior venture on record — neutral');
      if (p) events.push(p);
    }

    const identityHits = contradictions.filter(
      (c) => c.claim_ids.includes(claim.claim_id) && c.domain === 'identity' && c.status === 'open'
    );
    for (const hit of identityHits) {
      const delta = hit.severity === 'hard' ? -12 : -7;
      const e = addEvent(
        personId,
        'integrity',
        delta,
        claim.claim_id,
        `Identity claim disputed by independent source (${hit.rule}, ${hit.severity})`
      );
      if (e) events.push(e);
    }
  }

  if (events.length) {
    trace({
      agent: 'screener',
      action: 'founder_score_events',
      inputs: { claim_ids: personClaims.map((c) => c.claim_id) },
      output_refs: events.map((e) => e.event_id),
    });
  }
  return events;
}

export function founderSnapshot(personId: string): FounderScoreSnapshot {
  const events = where<FounderScoreEvent>('founder_score_events', (e) => e.person_id === personId);
  const components = {} as FounderScoreSnapshot['components'];
  let covered = 0;

  for (const [component, weight] of Object.entries(FOUNDER_WEIGHTS) as [FounderComponent, number][]) {
    const own = events.filter((e) => e.component === component);
    const value = Math.max(0, Math.min(100, 50 + own.reduce((s, e) => s + e.delta, 0)));
    if (own.length > 0) covered += 1;
    components[component] = { value, weight, evidence_count: own.length };
  }

  const coverage = covered / 8;
  const totalWeight = Object.values(FOUNDER_WEIGHTS).reduce((a, b) => a + b, 0);
  const weighted =
    Object.values(components).reduce((s, c) => s + c.value * c.weight, 0) / totalWeight;
  const spread = Math.round(8 + 35 * (1 - coverage));
  const center = Math.round(weighted);

  return {
    person_id: personId,
    total: coverage >= 0.5 ? center : null, // below 0.5 the UI says "not enough evidence"
    coverage,
    band: [Math.max(0, center - spread), Math.min(100, center + spread)],
    components,
    computed_at: now(),
  };
}
