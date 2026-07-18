import { callClaudeJSON } from '../../llm';
import { readPayload } from '../store';
import { ensurePerson, recordClaim, recordRelationship } from '../cartographer';
import { trace } from '../trace';
import type { Artifact, Claim } from '../schema';

interface RawExtractedClaim {
  subject: 'company' | 'person';
  person_name?: string;
  predicate: string;
  value: number | string;
  unit: string | null;
  period_start: string | null;
  period_end: string | null;
  basis: 'historical' | 'projected' | null;
  locator: string;
  verbatim_quote: string;
  confidence: number;
}

const SYSTEM = `You are the Extractor agent in a venture-capital diligence system. You turn a document into ATOMIC claims. You are a transcription instrument, not an analyst.

Hard rules:
- Every claim must come verbatim from the document. verbatim_quote must be an EXACT substring of the document text (a machine will check; claims failing the check are discarded).
- NEVER fill a gap from general knowledge. If something is not in the document, it does not exist. Returning few claims is correct behavior when the document is thin.
- Every numeric claim MUST have: unit (e.g. "USD", "percent", "count"), a period (period_start and period_end as ISO dates; for a point-in-time or "by YEAR" figure set both to that date), and basis: "historical" for reported actuals, "projected" for forecasts/targets. Numbers without these will be discarded.
- Monetary values: value is the plain number (e.g. "$400k" -> 400000), unit is the currency.
- One fact per claim. A sentence with three facts yields three claims.
- Be exhaustive: every slide/section should yield its facts, and EVERY named person yields role and prior_role/prior_venture claims. Team bios, market-size statements, product descriptions and asks are all claims.
- locator: where in the document, e.g. "slide 4" or "team page".

Useful predicates (snake_case; invent similar ones when needed): arr, mrr_total, growth_rate_mom, customer_count_design_partners, tam, raise_amount, founded_on, headquarters, product_description, technology_claim, pricing_model, prior_role, role, prior_venture.
- prior_role / role / prior_venture are subject:"person" claims with person_name set; value is the verbatim role description.

Respond ONLY with JSON: { "claims": [{ "subject": "company"|"person", "person_name": string?, "predicate": string, "value": number|string, "unit": string|null, "period_start": string|null, "period_end": string|null, "basis": "historical"|"projected"|null, "locator": string, "verbatim_quote": string, "confidence": number }] }`;

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export async function extractClaims(
  artifact: Artifact,
  companyId: string,
  opportunityId: string
): Promise<Claim[]> {
  const doc = readPayload(artifact.payload_path);
  const { claims: raw } = await callClaudeJSON<{ claims: RawExtractedClaim[] }>({
    system: SYSTEM,
    user: `DOCUMENT (${artifact.kind}, title: ${artifact.title})\n\n${doc}`,
    maxTokens: 6000,
    tier: 'heavy',
  });

  const docNorm = normalize(doc);
  const stored: Claim[] = [];
  const dropped: string[] = [];

  for (const rc of raw ?? []) {
    if (!rc.verbatim_quote || !docNorm.includes(normalize(rc.verbatim_quote))) {
      dropped.push(`${rc.predicate}: quote not found in document`);
      continue;
    }
    const isPerson = rc.subject === 'person' && rc.person_name;
    const subjectId = isPerson ? ensurePerson(rc.person_name!).person_id : companyId;
    const start = rc.period_start ?? rc.period_end;
    const end = rc.period_end ?? rc.period_start;
    const period = start && end ? { start, end } : null;

    const result = recordClaim({
      subject_type: isPerson ? 'person' : 'company',
      subject_id: subjectId,
      predicate: rc.predicate,
      value_json: rc.value,
      unit: rc.unit ?? null,
      period,
      basis: rc.basis ?? null,
      source: {
        artifact_id: artifact.artifact_id,
        locator: rc.locator,
        verbatim_quote: rc.verbatim_quote,
      },
      derivation: null,
      extraction_confidence: Math.max(0, Math.min(1, rc.confidence ?? 0.5)),
      supersedes: null,
      valid_at: rc.period_end ?? artifact.published_at,
      published_at: artifact.published_at,
      fetched_at: artifact.fetched_at,
      validated_at: null,
    });

    if (!result.ok) {
      dropped.push(`${rc.predicate}: ${result.reason}`);
      continue;
    }
    stored.push(result.claim);

    if (isPerson && rc.predicate === 'role' && typeof rc.value === 'string') {
      recordRelationship({
        person_id: subjectId,
        company_id: companyId,
        role: rc.value,
        valid_from: artifact.published_at,
        valid_to: null,
        evidence_claim_id: result.claim.claim_id,
      });
    }
  }

  trace({
    agent: 'extractor',
    action: 'extracted_claims',
    opportunity_id: opportunityId,
    inputs: {
      artifact_ids: [artifact.artifact_id],
      note: dropped.length ? `dropped ${dropped.length}: ${dropped.join('; ')}` : 'no drops',
    },
    output_refs: stored.map((c) => c.claim_id),
  });

  return stored;
}
