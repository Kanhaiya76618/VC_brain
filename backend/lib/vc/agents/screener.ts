import { callClaudeJSON } from '../../llm';
import { append, id, now, where } from '../store';
import { latestAssessment } from '../cartographer';
import { latestContradictions } from './adjudicator';
import { founderSnapshot, isBannedPredicate } from './founderScore';
import { trace } from '../trace';
import type {
  Axis,
  AxisScore,
  Claim,
  DecisionRoute,
  FounderScoreSnapshot,
  RoutingDecision,
  Subscore,
} from '../schema';

const RULE_VERSION = 'screener-v1';

// The three axes are scored independently, each by its own scorer with its own
// inputs, and are NEVER combined: there is no field anywhere that could hold a
// blended number, and the decision matrix routes on individual thresholds.

const AXIS_SUBSCORES: Record<Axis, { name: string; weight: number; hint: string }[]> = {
  founder: [
    { name: 'founder_score', weight: 0.25, hint: 'injected from the persistent Founder Score — do not score this one' },
    { name: 'capability_relevance', weight: 0.2, hint: 'capability relevant to THIS problem' },
    { name: 'execution_velocity', weight: 0.2, hint: 'shipping pace evidenced by dated artifacts' },
    { name: 'collaboration', weight: 0.15, hint: 'role complementarity, co-founder dynamics' },
    { name: 'integrity', weight: 0.1, hint: 'calibration of claims vs evidence; contradictions count here' },
    { name: 'commitment', weight: 0.1, hint: 'full-time status, skin in the game' },
  ],
  market: [
    { name: 'pain_willingness', weight: 0.25, hint: 'pain intensity + willingness to pay' },
    { name: 'bottom_up_sam', weight: 0.2, hint: 'bottom-up SAM and an identifiable budget owner' },
    { name: 'timing_trigger', weight: 0.15, hint: 'structural trigger making this possible NOW' },
    { name: 'competition_friction', weight: 0.15, hint: 'competition and switching friction' },
    { name: 'growth_economics', weight: 0.15, hint: 'growth economics of the category' },
    { name: 'regulatory_risk', weight: 0.1, hint: 'regulatory risk (higher score = lower risk)' },
  ],
  idea_market: [
    { name: 'wedge_specificity', weight: 0.2, hint: 'wedge and ICP specificity' },
    { name: 'problem_solution_evidence', weight: 0.25, hint: 'observed problem-solution evidence' },
    { name: 'differentiation', weight: 0.15, hint: 'differentiation vs the current workaround' },
    { name: 'gtm_feasibility', weight: 0.15, hint: 'go-to-market feasibility' },
    { name: 'unit_economics', weight: 0.15, hint: 'unit economics as evidenced' },
    { name: 'pivot_surface', weight: 0.1, hint: 'pivot surface area if the wedge fails' },
  ],
};

function formatClaimLine(c: Claim): string {
  const a = latestAssessment(c.claim_id);
  const trust = a ? `trust ${a.trust}/100 (${a.band})` : 'unassessed';
  const period = c.period ? ` ${c.period.start}..${c.period.end}` : '';
  const basis = c.basis ? ` [${c.basis.toUpperCase()}]` : '';
  const derived = c.derivation ? ` [DERIVED: ${c.derivation.calculation}]` : '';
  return `[${c.claim_id}] (${trust}) ${c.predicate} = ${JSON.stringify(c.value_json)}${
    c.unit ? ` ${c.unit}` : ''
  }${period}${basis} — "${c.source.verbatim_quote}" (${c.source.locator})${derived}`;
}

// Single gate for everything an axis scorer is allowed to see. Banned access
// proxies are stripped here, before any LLM input is assembled, and projected
// figures are excluded from traction-bearing axes.
function scorerInput(claims: Claim[], axis: Axis): string {
  const visible = claims.filter((c) => !isBannedPredicate(c.predicate));
  const scoped =
    axis === 'founder' ? visible : visible.filter((c) => c.basis !== 'projected');
  const excluded = visible.length - scoped.length;

  const contradictionLines = latestContradictions()
    .filter((ctr) => ctr.claim_ids.some((cid) => scoped.some((c) => c.claim_id === cid)))
    .map(
      (ctr) =>
        `- [${ctr.severity.toUpperCase()} · ${ctr.rule}] ${ctr.detail}${
          ctr.llm_reconciliation_note ? ` (possible reconciliation: ${ctr.llm_reconciliation_note})` : ''
        }`
    );

  return [
    'CLAIMS (with per-claim trust):',
    ...scoped.map(formatClaimLine),
    excluded > 0 ? `(${excluded} PROJECTED claim(s) excluded — projections are barred from traction scoring)` : '',
    '',
    'OPEN CONTRADICTIONS:',
    contradictionLines.length ? contradictionLines.join('\n') : '(none)',
  ]
    .filter(Boolean)
    .join('\n');
}

interface RawSubscore {
  name: string;
  value: number | null;
  rationale: string;
  evidence_claim_ids: string[];
}

const AXIS_SYSTEM = `You are one of three INDEPENDENT screening scorers in a VC diligence system. You score exactly one axis; you never see or influence the other axes.

Rules:
- Score each listed subscore 0-100, grounded ONLY in the claims provided. Weight low-trust claims accordingly; treat contradicted claims as near-worthless.
- If there is NO relevant evidence for a subscore, set value to null and evidence_claim_ids to []. Missing evidence is NEUTRAL — null, never 0. Scoring 0 for absence of data is the single worst error you can make.
- Every non-null subscore MUST cite evidence_claim_ids from the claim list.
- BANNED as factors under any name: school prestige, employer brand, follower counts, network size, location, age, gender, ethnicity, inferred personality. If you catch yourself reasoning from one of these, discard that reasoning.
- rationale: one concrete sentence naming the evidence.

Respond ONLY with JSON: { "subscores": [{ "name": string, "value": number|null, "rationale": string, "evidence_claim_ids": string[] }] }`;

async function scoreAxis(
  axis: Axis,
  claims: Claim[],
  opportunityId: string,
  founder: FounderScoreSnapshot | null
): Promise<AxisScore> {
  const spec = AXIS_SUBSCORES[axis];
  const askable = spec.filter((s) => s.name !== 'founder_score');

  const { subscores: raw } = await callClaudeJSON<{ subscores: RawSubscore[] }>({
    system: AXIS_SYSTEM,
    user: `AXIS: ${axis}\nSUBSCORES TO SCORE:\n${askable
      .map((s) => `- ${s.name} (weight ${s.weight}): ${s.hint}`)
      .join('\n')}\n\n${scorerInput(claims, axis)}`,
    maxTokens: 1200,
    tier: 'heavy',
  });

  const subscores: Subscore[] = spec.map((s) => {
    if (s.name === 'founder_score') {
      const value = founder && founder.total !== null ? founder.total : null;
      return {
        name: s.name,
        weight: s.weight,
        value,
        rationale:
          founder === null
            ? 'No founder linked.'
            : founder.total === null
              ? `Founder Score coverage ${founder.coverage.toFixed(2)} < 0.50 — not enough evidence (neutral, not adverse).`
              : `Persistent Founder Score ${founder.total}/100 (coverage ${founder.coverage.toFixed(2)}).`,
        evidence_claim_ids: [],
      };
    }
    const r = (raw ?? []).find((x) => x.name === s.name);
    const hasEvidence = r && Array.isArray(r.evidence_claim_ids) && r.evidence_claim_ids.length > 0;
    return {
      name: s.name,
      weight: s.weight,
      value: r && hasEvidence && typeof r.value === 'number' ? Math.max(0, Math.min(100, r.value)) : null,
      rationale: r?.rationale ?? 'No relevant evidence in the graph.',
      evidence_claim_ids: hasEvidence ? r!.evidence_claim_ids : [],
    };
  });

  const scored = subscores.filter((s) => s.value !== null);
  const coverage = scored.reduce((s, x) => s + x.weight, 0);
  const weighted =
    coverage > 0 ? scored.reduce((s, x) => s + x.value! * x.weight, 0) / coverage : null;
  const center = weighted === null ? null : Math.round(weighted);
  const spread = Math.round(10 + 30 * (1 - coverage));

  const axisScore = append<AxisScore>('axis_scores', {
    axis_score_id: id('axs'),
    opportunity_id: opportunityId,
    axis,
    score: coverage >= 0.5 ? center : null,
    coverage: Math.round(coverage * 100) / 100,
    band: center === null ? [0, 100] : [Math.max(0, center - spread), Math.min(100, center + spread)],
    trend: 'insufficient_history', // one observation window; a trend claim would be fabricated
    ...(axis === 'market' && center !== null && coverage >= 0.5
      ? { market_label: center >= 70 ? ('bull' as const) : center >= 45 ? ('neutral' as const) : ('bear' as const) }
      : {}),
    subscores,
    rule_version: RULE_VERSION,
    computed_at: now(),
  });

  trace({
    agent: 'screener',
    action: `scored_axis:${axis}`,
    opportunity_id: opportunityId,
    inputs: { claim_ids: claims.map((c) => c.claim_id) },
    output_refs: [axisScore.axis_score_id],
    rule_version: RULE_VERSION,
  });
  return axisScore;
}

export async function scoreAllAxes(
  claims: Claim[],
  opportunityId: string,
  primaryFounderId: string | null
): Promise<AxisScore[]> {
  const founder = primaryFounderId ? founderSnapshot(primaryFounderId) : null;
  // Sequential on purpose: independent prompts, and the fallback-free LLM
  // budget on a demo box prefers steady pacing over parallel bursts.
  const results: AxisScore[] = [];
  for (const axis of ['founder', 'market', 'idea_market'] as Axis[]) {
    results.push(await scoreAxis(axis, claims, opportunityId, founder));
  }
  return results;
}

export function latestAxisScores(opportunityId: string): AxisScore[] {
  const rows = where<AxisScore>('axis_scores', (a) => a.opportunity_id === opportunityId);
  const byAxis = new Map<Axis, AxisScore>();
  for (const row of rows) byAxis.set(row.axis, row);
  return [...byAxis.values()];
}

// The decision matrix routes on individual axis thresholds — never on any
// blend — and a hard open contradiction overrides every score.
export function routeDecision(
  opportunityId: string,
  axes: AxisScore[],
  claims: Claim[]
): RoutingDecision {
  const founder = axes.find((a) => a.axis === 'founder')?.score ?? null;
  const idea = axes.find((a) => a.axis === 'idea_market')?.score ?? null;
  const market = axes.find((a) => a.axis === 'market');

  const claimIds = new Set(claims.map((claim) => claim.claim_id));
  const hardOpen = latestContradictions().filter(
    (c) => c.severity === 'hard' && c.status === 'open' && c.claim_ids.some((claimId) => claimIds.has(claimId))
  );

  let route: DecisionRoute;
  let rule: string;
  if (hardOpen.length > 0) {
    route = 'hold';
    rule = `Hard contradiction open (${hardOpen.map((c) => `${c.rule}/${c.domain}`).join(', ')}) → HOLD for human review regardless of every score.`;
  } else if (founder !== null && founder >= 70 && idea !== null && idea >= 65) {
    route = 'advance';
    rule = 'Founder ≥ 70 AND Idea-vs-Market ≥ 65, no red flag → advance, propose check.';
  } else if (founder !== null && founder >= 70 && market?.market_label === 'bull' && (idea === null || idea < 60)) {
    route = 'founder_call_pivot';
    rule = 'Founder ≥ 70, Market Bull, Idea < 60 → founder call + pivot conversation.';
  } else if (idea !== null && idea >= 70 && (founder === null || founder < 60)) {
    route = 'request_evidence';
    rule = 'Idea ≥ 70, Founder < 60 → request evidence / team-completion plan.';
  } else {
    route = 'request_evidence';
    rule = 'No matrix row matched (insufficient scores or mid-band) → default to evidence request.';
  }

  const decision = append<RoutingDecision>('routing_decisions', {
    routing_id: id('rte'),
    opportunity_id: opportunityId,
    route,
    matrix_rule: rule,
    proposed_check: route === 'advance' ? 'Propose check within active thesis range' : null,
    decided_at: now(),
  });
  trace({
    agent: 'screener',
    action: `routed:${route}`,
    opportunity_id: opportunityId,
    inputs: { note: rule },
    output_refs: [decision.routing_id],
    rule_version: RULE_VERSION,
  });
  return decision;
}
