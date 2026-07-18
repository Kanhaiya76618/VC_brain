import { callClaude } from '../../llm';
import { append, find, id, now, where } from '../store';
import { artifactById, recordClaim } from '../cartographer';
import { trace } from '../trace';
import { validationsForClaim } from './validator';
import type {
  Claim,
  Contradiction,
  ContradictionRule,
  EvidenceAssessment,
  TrustBand,
  Validation,
} from '../schema';

const RULE_VERSION = 'adjudicator-v1';

// Predicates whose evidentiary value decays with time (activity signals).
// Achievements — shipped releases, papers, verified exits — never decay.
const CADENCE_PREDICATES = new Set(['growth_rate_mom', 'commit_cadence', 'release_cadence']);

function domainFor(predicate: string): Contradiction['domain'] {
  if (['arr', 'mrr_total', 'revenue'].includes(predicate)) return 'revenue';
  if (['prior_role', 'role', 'founder_identity'].includes(predicate)) return 'identity';
  if (['tam', 'sam', 'market_size'].includes(predicate)) return 'market';
  if (predicate === 'technology_claim') return 'technology';
  return 'other';
}

function alreadyFlagged(a: string, b: string, rule: ContradictionRule): boolean {
  return !!find<Contradiction>(
    'contradictions',
    (c) => c.rule === rule && c.claim_ids.includes(a) && c.claim_ids.includes(b)
  );
}

function flag(
  pair: [Claim, Claim],
  rule: ContradictionRule,
  severity: Contradiction['severity'],
  detail: string
): Contradiction | null {
  if (alreadyFlagged(pair[0].claim_id, pair[1].claim_id, rule)) return null;
  return append<Contradiction>('contradictions', {
    contradiction_id: id('ctr'),
    claim_ids: [pair[0].claim_id, pair[1].claim_id],
    rule,
    severity,
    domain: domainFor(pair[0].predicate),
    detail,
    llm_reconciliation_note: null,
    status: 'open',
    detected_at: now(),
    rule_version: RULE_VERSION,
  });
}

// Deterministic rules run BEFORE any LLM sees anything. The LLM's only role
// comes later: writing a reconciliation note. It cannot delete a flag.
export function runDeterministicRules(claims: Claim[]): Contradiction[] {
  const found: Contradiction[] = [];

  const numericGroups = new Map<string, Claim[]>();
  for (const c of claims) {
    if (typeof c.value_json !== 'number') continue;
    const key = `${c.subject_id}::${c.predicate}`;
    (numericGroups.get(key) ?? numericGroups.set(key, []).get(key)!).push(c);
  }

  for (const group of numericGroups.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (a.unit && b.unit && a.unit !== b.unit) {
          const c = flag([a, b], 'unit_mismatch', 'material', `Same predicate stated in ${a.unit} vs ${b.unit}.`);
          if (c) found.push(c);
          continue;
        }
        const av = a.value_json as number;
        const bv = b.value_json as number;
        const rel = Math.abs(av - bv) / Math.max(Math.min(Math.abs(av), Math.abs(bv)), 1);
        if (rel > 0.25) {
          const severity = rel > 0.75 ? 'hard' : rel > 0.4 ? 'material' : 'minor';
          const derivedNote = [a, b]
            .filter((c) => c.derivation)
            .map((c) => ` (${c.derivation!.calculation})`)
            .join('');
          const c = flag(
            [a, b],
            'value_tolerance',
            severity,
            `${a.predicate}: ${av.toLocaleString('en-US')} (${a.source.locator}) vs ${bv.toLocaleString('en-US')} (${b.source.locator}) — ${(rel * 100).toFixed(0)}% apart.${derivedNote}`
          );
          if (c) found.push(c);
        }
      }
    }
  }

  // Scope confusion: revenue claimed while the company's own materials
  // describe free pilots (pilot ≠ LOI ≠ contract ≠ revenue).
  const arrClaims = claims.filter((c) => c.predicate === 'arr' && typeof c.value_json === 'number' && !c.derivation);
  const freePilot = claims.find(
    (c) =>
      c.predicate === 'pricing_model' &&
      /free/i.test(c.source.verbatim_quote) &&
      /pilot/i.test(c.source.verbatim_quote)
  );
  if (freePilot) {
    for (const arr of arrClaims) {
      const c = flag(
        [arr, freePilot],
        'scope_confusion',
        'material',
        `ARR is claimed while the company's own materials describe free pilots ("${freePilot.source.verbatim_quote}"). Pilot usage is not revenue.`
      );
      if (c) found.push(c);
    }
  }

  return found;
}

// Contradicting external evidence found by the Validator is materialized as a
// counter-claim so both sides live in the graph and the pair is preserved.
export function contradictionsFromValidations(claims: Claim[]): Contradiction[] {
  const found: Contradiction[] = [];
  for (const claim of claims) {
    if (!['prior_role', 'role', 'prior_venture'].includes(claim.predicate)) continue;
    for (const v of validationsForClaim(claim.claim_id)) {
      if (v.verdict !== 'contradicted' && v.verdict !== 'partly_supported') continue;
      const ev = v.evidence[0];
      if (!ev?.artifact_id) continue;
      const already = find<Claim>(
        'claims',
        (c) =>
          c.subject_id === claim.subject_id &&
          c.predicate === claim.predicate &&
          c.source.artifact_id === ev.artifact_id
      );
      let counter = already;
      if (!counter) {
        const artifact = artifactById(ev.artifact_id);
        const res = recordClaim({
          subject_type: claim.subject_type,
          subject_id: claim.subject_id,
          predicate: claim.predicate,
          value_json: ev.snippet,
          unit: null,
          period: null,
          basis: null,
          source: {
            artifact_id: ev.artifact_id,
            locator: artifact?.title ?? 'source document',
            verbatim_quote: ev.snippet,
          },
          derivation: null,
          extraction_confidence: 0.8,
          supersedes: null,
          valid_at: artifact?.published_at ?? null,
          published_at: artifact?.published_at ?? null,
          fetched_at: artifact?.fetched_at ?? now(),
          validated_at: null,
        });
        if (!res.ok) continue;
        counter = res.claim;
      }
      const severity = v.verdict === 'contradicted' ? 'hard' : 'material';
      const c = flag(
        [claim, counter],
        'entity_identity',
        severity,
        `Stated: "${claim.source.verbatim_quote}" — independent source says: "${ev.snippet}". ${v.shown_calculation ?? ''}`.trim()
      );
      if (c) found.push(c);
    }
  }
  return found;
}

const RECONCILE_SYSTEM = `Two evidence-backed statements about a startup conflict. In 1-2 sentences, explain the most plausible way BOTH could be true, if any. If they cannot both be true, say so plainly. You are annotating the conflict, not resolving it — the flag stays either way.`;

export async function annotateContradictions(contradictions: Contradiction[]): Promise<void> {
  for (const c of contradictions) {
    try {
      const note = await callClaude({ system: RECONCILE_SYSTEM, user: c.detail, maxTokens: 200 });
      // Append-only: the annotated row supersedes nothing — we re-append with
      // the note and the UI reads the latest row per contradiction_id.
      append<Contradiction>('contradictions', { ...c, llm_reconciliation_note: note.trim() });
    } catch {
      /* a missing note never blocks the pipeline */
    }
  }
}

export function latestContradictions(): Contradiction[] {
  const byId = new Map<string, Contradiction>();
  for (const c of where<Contradiction>('contradictions', () => true)) {
    byId.set(c.contradiction_id, c); // later rows overwrite: last write is latest
  }
  return [...byId.values()];
}

function sourceScores(claim: Claim): { provenance: number; reliability: number } {
  const artifact = artifactById(claim.source.artifact_id);
  if (claim.derivation) return { provenance: 0.65, reliability: 0.6 };
  switch (artifact?.source) {
    case 'deck':
    case 'transcript':
      return { provenance: 0.4, reliability: 0.4 }; // founder-authored
    case 'website':
      return { provenance: 0.55, reliability: 0.6 }; // company-controlled but public
    case 'github':
      return { provenance: 0.85, reliability: 0.85 };
    case 'arxiv':
      return { provenance: 0.9, reliability: 0.9 };
    case 'hn':
      return { provenance: 0.7, reliability: 0.6 };
    case 'crunchbase_stub':
      return { provenance: 0.5, reliability: 0.5 };
    default:
      return { provenance: 0.5, reliability: 0.5 };
  }
}

function recencyScore(claim: Claim): number {
  if (!CADENCE_PREDICATES.has(claim.predicate)) return 1; // achievements and facts don't go stale
  if (!claim.valid_at) return 0.5;
  const days = (Date.now() - new Date(claim.valid_at).getTime()) / 86400000;
  return Math.max(0.1, Math.exp(-days / 90));
}

function agreementScore(validations: Validation[]): number {
  if (validations.length === 0) return 0.5;
  const latest = validations[validations.length - 1];
  switch (latest.verdict) {
    case 'supported':
      return 1;
    case 'partly_supported':
      return 0.65;
    case 'contradicted':
      return 0.1;
    default:
      return 0.5;
  }
}

export function assessClaim(claim: Claim): EvidenceAssessment {
  const { provenance, reliability } = sourceScores(claim);
  const directness = claim.derivation ? 0.8 : claim.source.verbatim_quote ? 1 : 0.6;
  const recency = recencyScore(claim);
  const validations = validationsForClaim(claim.claim_id);
  const agreement = agreementScore(validations);

  const open = latestContradictions().filter(
    (c) => c.claim_ids.includes(claim.claim_id) && c.status === 'open'
  );
  const conflictPenalty = open.reduce((max, c) => {
    const p = c.severity === 'hard' ? 30 : c.severity === 'material' ? 20 : 10;
    return Math.max(max, p);
  }, 0);

  const trust = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        30 * provenance + 25 * directness + 20 * reliability + 15 * recency + 10 * agreement - conflictPenalty
      )
    )
  );
  const band: TrustBand =
    trust >= 80 ? 'verified' : trust >= 60 ? 'corroborated' : trust >= 40 ? 'founder_stated' : 'weak_or_disputed';

  return append<EvidenceAssessment>('evidence_assessments', {
    assessment_id: id('eva'),
    claim_id: claim.claim_id,
    provenance,
    directness,
    reliability,
    recency,
    agreement,
    conflict_penalty: conflictPenalty,
    trust,
    band,
    rule_version: RULE_VERSION,
    computed_at: now(),
  });
}

export async function adjudicate(
  claims: Claim[],
  opportunityId: string
): Promise<{ contradictions: Contradiction[]; assessments: EvidenceAssessment[] }> {
  const fresh = [
    ...runDeterministicRules(claims),
    ...contradictionsFromValidations(claims),
  ];
  trace({
    agent: 'adjudicator',
    action: 'ran_deterministic_rules',
    opportunity_id: opportunityId,
    inputs: { claim_ids: claims.map((c) => c.claim_id) },
    output_refs: fresh.map((c) => c.contradiction_id),
    rule_version: RULE_VERSION,
  });

  await annotateContradictions(fresh);

  const assessments = claims.map((c) => assessClaim(c));
  trace({
    agent: 'adjudicator',
    action: 'assessed_trust',
    opportunity_id: opportunityId,
    inputs: { claim_ids: claims.map((c) => c.claim_id) },
    output_refs: assessments.map((a) => a.assessment_id),
    rule_version: RULE_VERSION,
  });

  return { contradictions: fresh, assessments };
}
