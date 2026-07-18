import { all, append, archivePayload, find, id, now, sha256, where } from './store';
import { trace } from './trace';
import type {
  Artifact,
  ArtifactKind,
  Claim,
  Company,
  Contradiction,
  EvidenceAssessment,
  ExternalIdentity,
  Person,
  Relationship,
  Source,
} from './schema';

export function normalizeName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeDomain(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];
}

// Strong-key resolution only: stable external ids and registrable domains.
// Name+context matches go through the merge queue (Phase 2); never name alone.
export function ensureCompany(name: string, domain: string | null): Company {
  const norm = domain ? normalizeDomain(domain) : null;
  if (norm) {
    const byDomain = find<Company>('companies', (c) => c.primary_domain === norm);
    if (byDomain) return byDomain;
  }
  const company = append<Company>('companies', {
    company_id: id('com'),
    canonical_name: name,
    primary_domain: norm,
  });
  if (norm) {
    append<ExternalIdentity>('external_identities', {
      identity_id: id('idn'),
      owner_type: 'company',
      owner_id: company.company_id,
      source: 'domain',
      external_id: norm,
      url: `https://${norm}`,
      handle: null,
      match_basis: 'strong_key',
    });
  }
  trace({ agent: 'cartographer', action: 'ensure_company', output_refs: [company.company_id] });
  return company;
}

export function ensurePerson(name: string): Person {
  const norm = normalizeName(name);
  const existing = find<Person>('persons', (p) => p.normalized_name === norm);
  if (existing) return existing;
  const person = append<Person>('persons', {
    person_id: id('per'),
    canonical_name: name,
    normalized_name: norm,
  });
  trace({ agent: 'cartographer', action: 'ensure_person', output_refs: [person.person_id] });
  return person;
}

export function upsertArtifact(input: {
  source: Source;
  kind: ArtifactKind;
  url: string | null;
  title: string;
  payload: string;
  published_at: string | null;
  synthetic: boolean;
  stub: boolean;
}): Artifact {
  const hash = sha256(input.payload);
  const existing = find<Artifact>('artifacts', (a) => a.raw_hash === hash);
  if (existing) return existing;
  const artifactId = id('art');
  const payloadPath = archivePayload(artifactId, input.payload);
  const artifact = append<Artifact>('artifacts', {
    artifact_id: artifactId,
    source: input.source,
    kind: input.kind,
    url: input.url,
    title: input.title,
    raw_hash: hash,
    payload_path: payloadPath,
    published_at: input.published_at,
    fetched_at: now(),
    synthetic: input.synthetic,
    stub: input.stub,
  });
  trace({
    agent: 'cartographer',
    action: 'archived_artifact',
    inputs: { urls: input.url ? [input.url] : [], note: input.title },
    output_refs: [artifactId],
  });
  return artifact;
}

function isNumericValue(value: unknown): boolean {
  return typeof value === 'number';
}

// Gatekeeper for the claims table: numeric claims must carry unit, period and
// basis, or they are rejected — the extractor's post-guard routes rejects to
// the trace log instead of the graph.
export function recordClaim(
  input: Omit<Claim, 'claim_id'>
): { ok: true; claim: Claim } | { ok: false; reason: string } {
  if (isNumericValue(input.value_json)) {
    if (!input.unit) return { ok: false, reason: 'numeric claim missing unit' };
    if (!input.period) return { ok: false, reason: 'numeric claim missing period' };
    if (!input.basis) return { ok: false, reason: 'numeric claim missing historical/projected basis' };
  }
  if (!input.source.artifact_id) return { ok: false, reason: 'claim has no source artifact' };
  const claim = append<Claim>('claims', { ...input, claim_id: id('clm') });
  return { ok: true, claim };
}

export function recordRelationship(
  input: Omit<Relationship, 'relationship_id'>
): Relationship {
  return append<Relationship>('relationships', { ...input, relationship_id: id('rel') });
}

export function claimsForSubject(subjectId: string): Claim[] {
  return where<Claim>('claims', (c) => c.subject_id === subjectId && !isSuperseded(c.claim_id));
}

function isSuperseded(claimId: string): boolean {
  return !!find<Claim>('claims', (c) => c.supersedes === claimId);
}

export function latestAssessment(claimId: string): EvidenceAssessment | undefined {
  const rows = where<EvidenceAssessment>('evidence_assessments', (a) => a.claim_id === claimId);
  return rows[rows.length - 1];
}

// Canonical view: highest-trust claim wins the display slot, but every
// competing claim rides along — the UI must show the alternatives.
export function canonicalView(
  subjectId: string,
  predicate: string
): { chosen: Claim | null; alternatives: Claim[] } {
  const claims = claimsForSubject(subjectId).filter((c) => c.predicate === predicate);
  if (claims.length === 0) return { chosen: null, alternatives: [] };
  const ranked = [...claims].sort(
    (a, b) => (latestAssessment(b.claim_id)?.trust ?? 0) - (latestAssessment(a.claim_id)?.trust ?? 0)
  );
  return { chosen: ranked[0], alternatives: ranked.slice(1) };
}

export function openContradictionsFor(claimIds: string[]): Contradiction[] {
  const set = new Set(claimIds);
  return where<Contradiction>(
    'contradictions',
    (c) => c.claim_ids.some((cid) => set.has(cid))
  );
}

export function artifactById(artifactId: string): Artifact | undefined {
  return find<Artifact>('artifacts', (a) => a.artifact_id === artifactId);
}

export function allClaims(): Claim[] {
  return all<Claim>('claims').filter((c) => !isSuperseded(c.claim_id));
}
