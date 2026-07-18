import { all, where } from './store';
import {
  allClaims,
  artifactById,
  claimsForSubject,
  ensureCompany,
  latestAssessment,
  upsertArtifact,
} from './cartographer';
import {
  companyById,
  createOpportunity,
  currentPoint,
  currentStage,
  latestRouting,
  opportunityById,
  pipelineMetrics,
  transition,
  transitionsFor,
} from './orchestrator';
import { extractClaims } from './agents/extractor';
import { validateClaims, validationsForClaim } from './agents/validator';
import { adjudicate, assessClaim, latestContradictions } from './agents/adjudicator';
import { deriveFounderEvents, founderSnapshot } from './agents/founderScore';
import { latestAxisScores, routeDecision, scoreAllAxes } from './agents/screener';
import { buildMemo, latestMemo } from './agents/memoWriter';
import { DRIFTLOCK_SITE, deckAsText } from './seed/driftlock';
import { resetAllTables } from './store';
import type { Claim, Person, Relationship, TraceEvent } from './schema';

function relatedPersonIds(companyId: string): string[] {
  return [
    ...new Set(
      where<Relationship>('relationships', (r) => r.company_id === companyId).map((r) => r.person_id)
    ),
  ];
}

export function collectClaims(opportunityId: string): Claim[] {
  const opp = opportunityById(opportunityId);
  if (!opp) return [];
  const subjects = new Set<string>([opp.company_id, ...relatedPersonIds(opp.company_id)]);
  return allClaims().filter((c) => subjects.has(c.subject_id));
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

export async function seedDriftlock(): Promise<{ opportunity_id: string }> {
  resetAllTables();

  const company = ensureCompany('Driftlock AI', 'driftlock.ai');
  const deck = upsertArtifact({
    company_id: company.company_id,
    source: 'deck',
    kind: 'pitch_deck',
    url: null,
    title: 'Driftlock AI pre-seed deck (synthetic)',
    payload: deckAsText(),
    published_at: '2026-06-30T00:00:00.000Z',
    synthetic: true,
    stub: false,
  });
  const site = upsertArtifact({
    company_id: company.company_id,
    source: 'website',
    kind: 'website_snapshot',
    url: 'https://driftlock.ai',
    title: 'driftlock.ai website snapshot (synthetic)',
    payload: DRIFTLOCK_SITE,
    published_at: '2026-07-10T00:00:00.000Z',
    synthetic: true,
    stub: false,
  });
  upsertArtifact({
    company_id: company.company_id,
    source: 'market_benchmark_stub',
    kind: 'market_benchmark',
    url: null,
    title: 'Independent market benchmark (synthetic demo)',
    payload:
      'Synthetic independent diligence benchmark. Eligible target accounts: 15,000. Annual contract value: $50,000. Bottom-up TAM: $750,000,000. This benchmark is seeded solely to demonstrate a transparent market-size contradiction.',
    published_at: '2026-07-12T00:00:00.000Z',
    synthetic: true,
    stub: true,
  });

  const opp = createOpportunity(company.company_id, 'inbound', hoursAgo(22));
  transition(opp.opportunity_id, 'ingested', 'system', hoursAgo(21));

  await extractClaims(deck, company.company_id, opp.opportunity_id);
  await extractClaims(site, company.company_id, opp.opportunity_id);

  return { opportunity_id: opp.opportunity_id };
}

export async function runDiligence(opportunityId: string): Promise<void> {
  const opp = opportunityById(opportunityId);
  if (!opp) throw new Error(`Unknown opportunity: ${opportunityId}`);

  if (currentPoint(opportunityId) === 'decision') {
    throw new Error('This opportunity already has a decision. Ingest a new evidence event before re-running diligence.');
  }
  if (currentPoint(opportunityId) === 'ingested') {
    transition(opportunityId, 'screened', 'system');
  }

  let claims = collectClaims(opportunityId);
  await validateClaims(claims, opportunityId);

  claims = collectClaims(opportunityId); // pick up validator-derived claims
  await adjudicate(claims, opportunityId);

  claims = collectClaims(opportunityId); // pick up adjudicator counter-claims
  for (const c of claims) {
    if (!latestAssessment(c.claim_id)) assessClaim(c);
  }

  for (const personId of relatedPersonIds(opp.company_id)) {
    deriveFounderEvents(personId, claimsForSubject(personId));
  }

  if (currentPoint(opportunityId) === 'screened') {
    transition(opportunityId, 'diligence', 'system');
  }

  const personIds = relatedPersonIds(opp.company_id);
  const primaryFounder =
    personIds
      .map((pid) => ({ pid, n: claimsForSubject(pid).length }))
      .sort((a, b) => b.n - a.n)[0]?.pid ?? null;

  const axes = await scoreAllAxes(claims, opportunityId, primaryFounder);
  await buildMemo(opportunityId, claims);
  routeDecision(opportunityId, axes, claims);

  if (currentPoint(opportunityId) === 'diligence') {
    transition(opportunityId, 'decision', 'system');
  }
}

export function opportunityView(opportunityId: string) {
  const opp = opportunityById(opportunityId);
  if (!opp) return null;
  const company = companyById(opp.company_id);
  const claims = collectClaims(opportunityId);
  const claimIds = new Set(claims.map((c) => c.claim_id));

  const persons = where<Person>('persons', (p) =>
    relatedPersonIds(opp.company_id).includes(p.person_id)
  );

  return {
    opportunity: opp,
    company,
    stage: currentStage(opportunityId),
    transitions: transitionsFor(opportunityId),
    persons: persons.map((p) => ({ ...p, founder_score: founderSnapshot(p.person_id) })),
    claims: claims.map((c) => ({
      ...c,
      assessment: latestAssessment(c.claim_id) ?? null,
      validations: validationsForClaim(c.claim_id),
      artifact: artifactById(c.source.artifact_id) ?? null,
    })),
    contradictions: latestContradictions().filter((ctr) =>
      ctr.claim_ids.some((cid) => claimIds.has(cid))
    ),
    axes: latestAxisScores(opportunityId),
    routing: latestRouting(opportunityId) ?? null,
    memo: latestMemo(opportunityId) ?? null,
    metrics: pipelineMetrics(),
  };
}

export function pipelineView() {
  const opps = all<{ opportunity_id: string; company_id: string; entry_point: string }>(
    'opportunities'
  );
  return {
    metrics: pipelineMetrics(),
    opportunities: opps.map((o) => ({
      ...o,
      company: companyById(o.company_id) ?? null,
      stage: currentStage(o.opportunity_id),
      routing: latestRouting(o.opportunity_id) ?? null,
      transitions: transitionsFor(o.opportunity_id),
    })),
  };
}

export function traceView(opportunityId: string): TraceEvent[] {
  return where<TraceEvent>(
    'trace_events',
    (t) => t.opportunity_id === opportunityId || t.opportunity_id === null
  );
}
