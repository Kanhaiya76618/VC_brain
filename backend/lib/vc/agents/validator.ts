import { callClaudeJSON } from '../../llm';
import { append, find, id, now, readPayload, where } from '../store';
import { recordClaim } from '../cartographer';
import { trace } from '../trace';
import type { Artifact, Claim, Validation, ValidationVerdict } from '../schema';

// The Validator is explicitly instructed not to trust the Extractor: it
// re-derives numbers, cross-checks people against other artifacts, and runs
// its own bottom-up market math. It may not invent a source — any check that
// finds no independent evidence returns insufficient_evidence.

function saveValidation(v: Omit<Validation, 'validation_id' | 'validated_at'>): Validation {
  const guarded: typeof v =
    v.evidence.length === 0 && v.verdict !== 'insufficient_evidence'
      ? {
          ...v,
          verdict: 'insufficient_evidence',
          shown_calculation: v.shown_calculation,
        }
      : v;
  return append<Validation>('validations', {
    ...guarded,
    validation_id: id('val'),
    validated_at: now(),
  });
}

function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

// Derived claims are deduped per (subject, predicate, method): re-running
// validation must not mint a second derived figure for the same computation.
function existingDerived(subjectId: string, predicate: string, method: string): Claim | undefined {
  return find<Claim>(
    'claims',
    (c) =>
      c.subject_id === subjectId && c.predicate === predicate && c.derivation?.method === method
  );
}

function validateRevenue(claim: Claim, siblingClaims: Claim[]): Validation {
  const mrr = siblingClaims.find(
    (c) => c.predicate === 'mrr_total' && typeof c.value_json === 'number'
  );
  if (!mrr) {
    return saveValidation({
      claim_id: claim.claim_id,
      verdict: 'insufficient_evidence',
      method: 'mrr_x12_check',
      evidence: [],
      shown_calculation: 'No independent MRR figure found to recompute ARR from.',
    });
  }

  const implied = (mrr.value_json as number) * 12;
  const claimed = claim.value_json as number;
  const calculation = `${fmtUsd(mrr.value_json as number)} total MRR (${mrr.source.locator}) × 12 = ${fmtUsd(implied)} implied ARR, vs stated ${fmtUsd(claimed)} (${claim.source.locator})`;

  // The implied figure enters the graph as a derived claim so the
  // adjudicator's deterministic value-tolerance rule sees both numbers.
  const derived = existingDerived(claim.subject_id, claim.predicate, 'mrr_x12_from_reported_total')
    ? { ok: false as const, reason: 'already derived' }
    : recordClaim({
    subject_type: claim.subject_type,
    subject_id: claim.subject_id,
    predicate: claim.predicate,
    value_json: implied,
    unit: mrr.unit,
    period: mrr.period,
    basis: 'historical',
    source: {
      artifact_id: mrr.source.artifact_id,
      locator: mrr.source.locator,
      verbatim_quote: mrr.source.verbatim_quote,
    },
    derivation: {
      method: 'mrr_x12_from_reported_total',
      from_claim_ids: [mrr.claim_id],
      calculation,
    },
    extraction_confidence: mrr.extraction_confidence,
    supersedes: null,
    valid_at: mrr.valid_at,
    published_at: mrr.published_at,
    fetched_at: mrr.fetched_at,
    validated_at: null,
  });

  const ratio = Math.abs(claimed - implied) / Math.max(implied, 1);
  const verdict: ValidationVerdict =
    ratio <= 0.1 ? 'supported' : ratio <= 0.25 ? 'partly_supported' : 'contradicted';

  return saveValidation({
    claim_id: claim.claim_id,
    verdict,
    method: 'mrr_x12_check',
    evidence: [
      {
        artifact_id: mrr.source.artifact_id,
        snippet: mrr.source.verbatim_quote,
      },
    ],
    shown_calculation: derived.ok ? derived.claim.derivation!.calculation : calculation,
  });
}

interface RoleCheck {
  verdict: ValidationVerdict;
  snippet: string;
  note: string;
}

async function validateRole(claim: Claim, snapshots: Artifact[]): Promise<Validation> {
  if (snapshots.length === 0) {
    return saveValidation({
      claim_id: claim.claim_id,
      verdict: 'insufficient_evidence',
      method: 'site_cross_check',
      evidence: [],
      shown_calculation: null,
    });
  }
  const site = snapshots[0];
  const siteText = readPayload(site.payload_path);
  const result = await callClaudeJSON<RoleCheck>({
    system: `You verify a role/employment claim against an independent source document. Do not trust the claim; compare it strictly against the source.
- snippet MUST be an exact substring of the source document that is the most relevant passage. If no relevant passage exists, verdict is "insufficient_evidence" and snippet is "".
- "supported": the source states the same role and employment nature. "partly_supported": overlapping but weaker/different (e.g. contractor vs employee, shorter tenure). "contradicted": the source states something incompatible.
Respond ONLY with JSON: { "verdict": "supported"|"partly_supported"|"contradicted"|"insufficient_evidence", "snippet": string, "note": string }`,
    user: `CLAIM (from ${claim.source.locator}): "${claim.source.verbatim_quote}"\n\nSOURCE DOCUMENT (${site.title}):\n${siteText}`,
    maxTokens: 800,
  });

  const snippetOk = result.snippet && siteText.toLowerCase().includes(result.snippet.toLowerCase());
  return saveValidation({
    claim_id: claim.claim_id,
    verdict: snippetOk ? result.verdict : 'insufficient_evidence',
    method: 'site_cross_check',
    evidence: snippetOk
      ? [{ artifact_id: site.artifact_id, url: site.url ?? undefined, snippet: result.snippet }]
      : [],
    shown_calculation: snippetOk ? result.note : null,
  });
}

interface BottomUpTam {
  target_accounts: number;
  acv_usd: number;
  rationale: string;
}

async function validateTam(claim: Claim, siblingClaims: Claim[]): Promise<Validation> {
  const productContext = siblingClaims
    .filter((c) => ['product_description', 'pricing_model', 'technology_claim'].includes(c.predicate))
    .map((c) => `- ${c.source.verbatim_quote}`)
    .join('\n');

  const est = await callClaudeJSON<BottomUpTam>({
    system: `You run an INDEPENDENT bottom-up market sizing for a startup, from first principles: how many organizations could realistically buy this product (target_accounts) and at what annual contract value (acv_usd). Be conservative and concrete; state your reasoning in rationale. Do NOT anchor on any number the company claims.
Respond ONLY with JSON: { "target_accounts": number, "acv_usd": number, "rationale": string }`,
    user: `PRODUCT EVIDENCE:\n${productContext || '(none)'}\n\nThe company claims (do not anchor on it): "${claim.source.verbatim_quote}"`,
    maxTokens: 800,
    tier: 'heavy',
  });

  const bottomUp = est.target_accounts * est.acv_usd;
  const claimed = claim.value_json as number;
  const ratio = claimed / Math.max(bottomUp, 1);
  const verdict: ValidationVerdict = ratio <= 2 ? 'supported' : ratio <= 5 ? 'partly_supported' : 'contradicted';
  const calculation = `Bottom-up: ${est.target_accounts.toLocaleString('en-US')} target accounts × ${fmtUsd(est.acv_usd)} ACV = ${fmtUsd(bottomUp)}; stated TAM ${fmtUsd(claimed)} is ${ratio.toFixed(1)}× the bottom-up figure. ${est.rationale}`;

  const derived = existingDerived(claim.subject_id, 'tam', 'bottom_up_accounts_x_acv')
    ? null
    : recordClaim({
    subject_type: claim.subject_type,
    subject_id: claim.subject_id,
    predicate: 'tam',
    value_json: bottomUp,
    unit: 'USD',
    period: claim.period,
    basis: 'historical',
    source: claim.source,
    derivation: {
      method: 'bottom_up_accounts_x_acv',
      from_claim_ids: [claim.claim_id],
      calculation,
    },
    extraction_confidence: 0.6,
    supersedes: null,
    valid_at: claim.valid_at,
    published_at: null,
    fetched_at: now(),
    validated_at: null,
  });
  void derived;

  return saveValidation({
    claim_id: claim.claim_id,
    verdict,
    method: 'bottom_up_tam',
    evidence: [
      {
        artifact_id: claim.source.artifact_id,
        snippet: claim.source.verbatim_quote,
      },
    ],
    shown_calculation: calculation,
  });
}

export async function validateClaims(
  claims: Claim[],
  opportunityId: string
): Promise<Validation[]> {
  const snapshots = where<Artifact>(
    'artifacts',
    (a) => a.kind === 'website_snapshot'
  );
  const results: Validation[] = [];

  for (const claim of claims) {
    if (claim.derivation) continue; // derived claims are outputs, not inputs, of validation
    if (validationsForClaim(claim.claim_id).length > 0) continue; // idempotent re-runs
    let v: Validation | null = null;
    if (claim.predicate === 'arr' && typeof claim.value_json === 'number') {
      v = validateRevenue(claim, claims);
    } else if (['prior_role', 'role', 'prior_venture'].includes(claim.predicate)) {
      v = await validateRole(claim, snapshots);
    } else if (claim.predicate === 'tam' && typeof claim.value_json === 'number') {
      v = await validateTam(claim, claims);
    }
    if (v) {
      results.push(v);
      trace({
        agent: 'validator',
        action: `validated:${v.method}:${v.verdict}`,
        opportunity_id: opportunityId,
        inputs: { claim_ids: [claim.claim_id] },
        output_refs: [v.validation_id],
      });
    }
  }
  return results;
}

export function validationsForClaim(claimId: string): Validation[] {
  return where<Validation>('validations', (v) => v.claim_id === claimId);
}
