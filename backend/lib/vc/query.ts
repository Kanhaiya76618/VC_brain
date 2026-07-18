import { all, where } from './store';
import { artifactById } from './cartographer';
import type { Claim, Company, Relationship } from './schema';

export interface ParsedClause {
  key: 'technical_founder' | 'geography' | 'sector' | 'enterprise_traction' | 'no_prior_vc' | 'accelerator' | 'keyword';
  label: string;
  value: string | null;
}

export interface QueryEvidence {
  claim_id: string;
  predicate: string;
  value: unknown;
  quote: string;
  artifact: { title: string; url: string | null; fetched_at: string } | null;
}

export interface QueryResult {
  company: Company;
  matched: Array<{ clause: ParsedClause; evidence: QueryEvidence }>;
  missing: ParsedClause[];
  score: number;
}

function norm(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

export function parseCompoundQuery(query: string): ParsedClause[] {
  const value = query.toLowerCase();
  const clauses: ParsedClause[] = [];
  if (/technical\s+founder|founder.*technical/.test(value)) clauses.push({ key: 'technical_founder', label: 'technical founder', value: null });
  const city = ['berlin', 'london', 'paris', 'new york', 'san francisco'].find((place) => value.includes(place));
  if (city) clauses.push({ key: 'geography', label: city[0].toUpperCase() + city.slice(1), value: city });
  if (/ai\s*(infra|infrastructure)/.test(value)) clauses.push({ key: 'sector', label: 'AI infrastructure', value: 'ai infrastructure' });
  else if (value.includes('industrial software')) clauses.push({ key: 'sector', label: 'industrial software', value: 'industrial software' });
  if (/enterprise\s+traction|enterprise\s+customer/.test(value)) clauses.push({ key: 'enterprise_traction', label: 'enterprise traction', value: null });
  if (/no\s+(prior\s+)?(vc|venture capital|institutional funding)|bootstrapped/.test(value)) clauses.push({ key: 'no_prior_vc', label: 'no prior VC backing', value: null });
  if (/top[ -]?tier\s+accelerator/.test(value)) clauses.push({ key: 'accelerator', label: 'top-tier accelerator', value: null });
  if (clauses.length === 0) {
    for (const token of value.split(/[,;]|\band\b/).map((part) => part.trim()).filter((part) => part.length >= 3).slice(0, 5)) {
      clauses.push({ key: 'keyword', label: token, value: token });
    }
  }
  return clauses;
}

function evidence(claim: Claim): QueryEvidence {
  const artifact = artifactById(claim.source.artifact_id);
  return {
    claim_id: claim.claim_id,
    predicate: claim.predicate,
    value: claim.value_json,
    quote: claim.source.verbatim_quote,
    artifact: artifact ? { title: artifact.title, url: artifact.url, fetched_at: artifact.fetched_at } : null,
  };
}

function matchesClause(claim: Claim, clause: ParsedClause, personIds: Set<string>): boolean {
  const value = norm(claim.value_json);
  switch (clause.key) {
    case 'technical_founder':
      return personIds.has(claim.subject_id) && (claim.predicate === 'technical_work' || (claim.predicate === 'role' && value.includes('technical')));
    case 'geography':
      return claim.predicate === 'geography' && value.includes(clause.value ?? '');
    case 'sector':
      return claim.predicate === 'sector' && value.includes(clause.value ?? '');
    case 'enterprise_traction':
      return claim.predicate === 'enterprise_traction';
    case 'no_prior_vc':
      return claim.predicate === 'prior_institutional_funding' && claim.value_json === false;
    case 'accelerator':
      return claim.predicate === 'accelerator_tier' && /top[ -]?tier/.test(value);
    case 'keyword':
      return `${claim.predicate} ${value} ${claim.source.verbatim_quote.toLowerCase()}`.includes(clause.value ?? '');
  }
}

// A single graph pass resolves every clause. It does not fan out into a stack
// of UI filters, and every positive match returns the exact graph evidence.
export function queryEvidenceGraph(query: string): { query: string; clauses: ParsedClause[]; results: QueryResult[]; near_misses: QueryResult[] } {
  const clauses = parseCompoundQuery(query);
  const relationships = all<Relationship>('relationships');
  const claims = all<Claim>('claims');
  const candidates = all<Company>('companies').map((company) => {
    const personIds = new Set(relationships.filter((relationship) => relationship.company_id === company.company_id).map((relationship) => relationship.person_id));
    const reachableClaims = claims.filter((claim) => claim.subject_id === company.company_id || personIds.has(claim.subject_id));
    const matched = clauses.flatMap((clause) => {
      const claim = reachableClaims.find((item) => matchesClause(item, clause, personIds));
      return claim ? [{ clause, evidence: evidence(claim) }] : [];
    });
    const missing = clauses.filter((clause) => !matched.some((item) => item.clause.key === clause.key && item.clause.value === clause.value));
    return { company, matched, missing, score: matched.length * 20 };
  }).filter((result) => result.matched.length > 0).sort((a, b) => b.score - a.score || a.company.canonical_name.localeCompare(b.company.canonical_name));
  return { query, clauses, results: candidates.filter((candidate) => candidate.missing.length === 0), near_misses: candidates.filter((candidate) => candidate.missing.length > 0).slice(0, 8) };
}

