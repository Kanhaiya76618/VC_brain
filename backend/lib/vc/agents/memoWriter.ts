import { callClaudeJSON } from '../../llm';
import { append, id, now, where } from '../store';
import { latestAssessment } from '../cartographer';
import { latestContradictions } from './adjudicator';
import { trace } from '../trace';
import type { Claim, Memo, MemoSection } from '../schema';

const SECTIONS: MemoSection['title'][] = [
  'Company snapshot',
  'Investment hypotheses',
  'SWOT',
  'Problem & product',
  'Traction & KPIs',
];

// Predicates a diligence memo is expected to cover; absence renders as an
// explicit "not disclosed" flag, never as silence and never as invention.
const EXPECTED_DISCLOSURES: { predicate: string; label: string }[] = [
  { predicate: 'cap_table', label: 'Cap table' },
  { predicate: 'customer_references', label: 'Customer references' },
  { predicate: 'funding_history', label: 'Prior funding history' },
  { predicate: 'churn', label: 'Churn / retention data' },
  { predicate: 'burn_rate', label: 'Burn rate' },
  { predicate: 'competition', label: 'Competitive landscape (company-stated)' },
];

interface RawMemo {
  sections: {
    title: string;
    sentences: { text: string; claim_ids: string[] }[];
  }[];
  hypotheses: { statement: string; falsifier: string; claim_ids: string[] }[];
}

const SYSTEM = `You write a terse, evidence-backed VC investment memo. Padding is penalized.

Rules:
- Use ONLY the claims provided. Every sentence that states a fact must list the claim_ids it rests on. A sentence with an empty claim_ids list may contain only reasoning/framing, never a fact or number (a machine drops factual sentences without citations).
- Never smooth over a contradiction: if the evidence conflicts, the memo SAYS it conflicts, citing both claims.
- Respect trust bands: introduce weak/disputed figures as "the company states…", never as established fact.
- Do not mention anything absent from the claims. Missing data is handled elsewhere — do not guess.
- Sections, exactly these five titles: "Company snapshot", "Investment hypotheses", "SWOT", "Problem & product", "Traction & KPIs". Keep each to 2-5 sentences (SWOT may use compact "Strengths: … Weaknesses: …" sentences).
- hypotheses: 2-3 falsifiable bets. Each must include falsifier: the concrete evidence that would DISPROVE it.

Respond ONLY with JSON: { "sections": [{ "title": string, "sentences": [{ "text": string, "claim_ids": string[] }] }], "hypotheses": [{ "statement": string, "falsifier": string, "claim_ids": string[] }] }`;

function claimLine(c: Claim): string {
  const a = latestAssessment(c.claim_id);
  return `[${c.claim_id}] (trust ${a?.trust ?? '?'} ${a?.band ?? 'unassessed'}) ${c.predicate} = ${JSON.stringify(
    c.value_json
  )}${c.unit ? ` ${c.unit}` : ''}${c.basis ? ` [${c.basis}]` : ''} — "${c.source.verbatim_quote}" (${c.source.locator})`;
}

const FACTUAL = /\d|ARR|MRR|TAM|revenue|customer|founder|CEO|CTO|Google|cohort/i;

export async function buildMemo(opportunityId: string, claims: Claim[]): Promise<Memo> {
  const contradictions = latestContradictions().filter((ctr) =>
    ctr.claim_ids.some((cid) => claims.some((c) => c.claim_id === cid))
  );

  const raw = await callClaudeJSON<RawMemo>({
    system: SYSTEM,
    user: [
      'CLAIMS:',
      ...claims.map(claimLine),
      '',
      'OPEN CONTRADICTIONS (must be reflected, never smoothed):',
      ...(contradictions.length
        ? contradictions.map((c) => `- [${c.severity}] ${c.detail} (claims: ${c.claim_ids.join(', ')})`)
        : ['(none)']),
    ].join('\n'),
    maxTokens: 4000,
    tier: 'heavy',
  });

  const knownIds = new Set(claims.map((c) => c.claim_id));
  let droppedCount = 0;

  const sections: MemoSection[] = SECTIONS.map((title) => {
    const rawSection = raw.sections?.find((s) => s.title === title);
    const sentences = (rawSection?.sentences ?? [])
      .map((s) => ({
        text: s.text,
        claim_ids: (s.claim_ids ?? []).filter((cid) => knownIds.has(cid)),
      }))
      .filter((s) => {
        // Post-guard: a factual-looking sentence with no surviving citation is
        // dropped — the memo may not assert what the graph cannot back.
        if (s.claim_ids.length === 0 && FACTUAL.test(s.text)) {
          droppedCount += 1;
          return false;
        }
        return true;
      });
    return { title, sentences };
  });

  const missing = EXPECTED_DISCLOSURES.filter(
    (d) => !claims.some((c) => c.predicate === d.predicate)
  ).map((d) => `${d.label}: not disclosed`);

  const memo = append<Memo>('memos', {
    memo_id: id('mem'),
    opportunity_id: opportunityId,
    sections,
    hypotheses: (raw.hypotheses ?? []).map((h) => ({
      statement: h.statement,
      falsifier: h.falsifier,
      claim_ids: (h.claim_ids ?? []).filter((cid) => knownIds.has(cid)),
    })),
    missing,
    generated_at: now(),
  });

  trace({
    agent: 'memo',
    action: 'built_memo',
    opportunity_id: opportunityId,
    inputs: {
      claim_ids: claims.map((c) => c.claim_id),
      note: droppedCount ? `dropped ${droppedCount} uncited factual sentence(s)` : 'all sentences cited',
    },
    output_refs: [memo.memo_id],
  });
  return memo;
}

export function latestMemo(opportunityId: string): Memo | undefined {
  const rows = where<Memo>('memos', (m) => m.opportunity_id === opportunityId);
  return rows[rows.length - 1];
}
