import { all, append, find, id, now, where } from './store';
import {
  ensureCompany,
  ensurePersonByExternalIdentity,
  normalizeDomain,
  recordClaim,
  recordRelationship,
  upsertArtifact,
} from './cartographer';
import { activeThesis, thesisFit } from './thesis';
import { createOpportunity } from './orchestrator';
import { trace } from './trace';
import { assessClaim, latestContradictions } from './agents/adjudicator';
import { deriveFounderEvents, founderSnapshot } from './agents/founderScore';
import type { Artifact, Claim, Lead, Relationship, ScoutSignal, Thesis } from './schema';

const DAY = 24 * 60 * 60 * 1000;
const ARXIV_MIN_INTERVAL_MS = 3_000;
let lastArxivRequestAt = 0;

type ScoutSource = ScoutSignal['source'];

export interface ScoutRunResult {
  mode: 'demo' | 'live';
  artifacts: number;
  signals: number;
  leads: number;
  source_status: Record<ScoutSource, 'ok' | 'skipped' | 'error'>;
  errors: string[];
}

interface GitHubRepo {
  full_name: string;
  name: string;
  html_url: string;
  homepage: string | null;
  description: string | null;
  created_at: string;
  pushed_at: string | null;
  owner: { login: string; html_url: string; id: number };
  topics?: string[];
}

interface HnItem {
  id: number;
  by?: string;
  title?: string;
  url?: string;
  time?: number;
  score?: number;
  type?: string;
}

function safeDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? normalizeDomain(parsed.hostname) : null;
  } catch {
    return null;
  }
}

function labelForDomain(domain: string): string {
  return domain
    .split('.')[0]
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

function stripXml(value: string | undefined): string {
  return (value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function artifactForCompany(input: {
  companyId: string | null;
  source: Artifact['source'];
  kind: Artifact['kind'];
  url: string | null;
  title: string;
  payload: string;
  publishedAt: string | null;
  synthetic: boolean;
  stub?: boolean;
}): Artifact {
  return upsertArtifact({
    company_id: input.companyId,
    source: input.source,
    kind: input.kind,
    url: input.url,
    title: input.title,
    payload: input.payload,
    published_at: input.publishedAt,
    synthetic: input.synthetic,
    stub: input.stub ?? false,
  });
}

function addSignal(input: Omit<ScoutSignal, 'signal_id'>): ScoutSignal {
  const existing = find<ScoutSignal>('scout_signals', (signal) => signal.artifact_id === input.artifact_id);
  if (existing) return existing;
  return append<ScoutSignal>('scout_signals', { signal_id: id('sig'), ...input });
}

function ensureClaim(input: {
  subjectId: string;
  predicate: string;
  value: unknown;
  artifactId: string;
  locator: string;
  quote: string;
  validAt?: string | null;
  publishedAt?: string | null;
}): Claim {
  const existing = find<Claim>(
    'claims',
    (claim) =>
      claim.subject_id === input.subjectId &&
      claim.predicate === input.predicate &&
      claim.source.artifact_id === input.artifactId &&
      claim.source.verbatim_quote === input.quote
  );
  if (existing) return existing;
  const result = recordClaim({
    subject_type: 'company',
    subject_id: input.subjectId,
    predicate: input.predicate,
    value_json: input.value,
    unit: null,
    period: null,
    basis: null,
    source: { artifact_id: input.artifactId, locator: input.locator, verbatim_quote: input.quote },
    derivation: null,
    extraction_confidence: 1,
    supersedes: null,
    valid_at: input.validAt ?? null,
    published_at: input.publishedAt ?? null,
    fetched_at: now(),
    validated_at: null,
  });
  if (!result.ok) throw new Error(result.reason);
  assessClaim(result.claim);
  return result.claim;
}

function ensurePersonClaim(input: Omit<Parameters<typeof ensureClaim>[0], 'subjectId'> & { subjectId: string }): Claim {
  const existing = find<Claim>(
    'claims',
    (claim) =>
      claim.subject_id === input.subjectId &&
      claim.predicate === input.predicate &&
      claim.source.artifact_id === input.artifactId &&
      claim.source.verbatim_quote === input.quote
  );
  if (existing) return existing;
  const result = recordClaim({
    subject_type: 'person',
    subject_id: input.subjectId,
    predicate: input.predicate,
    value_json: input.value,
    unit: null,
    period: null,
    basis: null,
    source: { artifact_id: input.artifactId, locator: input.locator, verbatim_quote: input.quote },
    derivation: null,
    extraction_confidence: 1,
    supersedes: null,
    valid_at: input.validAt ?? null,
    published_at: input.publishedAt ?? null,
    fetched_at: now(),
    validated_at: null,
  });
  if (!result.ok) throw new Error(result.reason);
  assessClaim(result.claim);
  return result.claim;
}

function ensureRelationship(personId: string, companyId: string, role: string, evidenceClaimId: string): void {
  const existing = find<Relationship>(
    'relationships',
    (relationship) =>
      relationship.person_id === personId &&
      relationship.company_id === companyId &&
      relationship.role === role &&
      relationship.evidence_claim_id === evidenceClaimId
  );
  if (!existing) {
    recordRelationship({ person_id: personId, company_id: companyId, role, valid_from: null, valid_to: null, evidence_claim_id: evidenceClaimId });
  }
}

function scoreLead(lead: Lead, thesis = activeThesis()): Lead & { total_score: number; thesis_fit: ReturnType<typeof thesisFit> } {
  const fit = thesisFit(lead.profile, thesis);
  const score = { ...lead.score, thesis_fit: fit.score };
  return { ...lead, score, thesis_fit: fit, total_score: Object.values(score).reduce((sum, value) => sum + value, 0) };
}

function companyArtifacts(companyId: string): Artifact[] {
  return where<Artifact>('artifacts', (artifact) => artifact.company_id === companyId);
}

function formationConditions(companyId: string, profile: Lead['profile'], thesis = activeThesis()): Lead['conditions'] {
  const signals = where<ScoutSignal>('scout_signals', (signal) => signal.company_id === companyId);
  const artifacts = companyArtifacts(companyId);
  const builderIds = [...new Set(signals.flatMap((signal) => signal.builder_external_ids))];
  const sourceCount = new Set(signals.map((signal) => signal.source)).size;
  const accelerating = signals.some(
    (signal) => signal.velocity !== null && signal.velocity.recent_14d > signal.velocity.prior_14d
  );
  const fit = thesisFit(profile, thesis);
  const funding = signals.some((signal) => signal.funding_status === 'confirmed') ? 'confirmed' : 'none_confirmed';
  const fundingArtifacts = artifacts.filter((artifact) => artifact.source === 'crunchbase_stub');

  return {
    a_linked_builders: {
      passed: builderIds.length >= 2,
      evidence_refs: signals.filter((signal) => signal.builder_external_ids.length > 0).map((signal) => signal.artifact_id),
      note: `${builderIds.length} stable builder identity${builderIds.length === 1 ? '' : 'ies'} linked to this company.`,
    },
    b_cross_source: {
      passed: sourceCount >= 2,
      evidence_refs: signals.map((signal) => signal.artifact_id),
      note: `${sourceCount} independent artifact type${sourceCount === 1 ? '' : 's'} observed.`,
    },
    c_velocity: {
      passed: accelerating,
      evidence_refs: signals.filter((signal) => signal.velocity !== null).map((signal) => signal.artifact_id),
      note: accelerating ? 'Recent 14-day activity exceeds the prior comparable window.' : 'No verified accelerating 14-day cadence.',
    },
    d_thesis_fit: {
      passed: fit.score >= 10,
      evidence_refs: signals.map((signal) => signal.artifact_id),
      note: `${fit.score}/20 against “${thesis.name}”: ${fit.matched.join('; ') || 'no matching profile fields'}.`,
    },
    e_no_prior_funding: {
      passed: funding !== 'confirmed',
      evidence_refs: fundingArtifacts.map((artifact) => artifact.artifact_id),
      note: funding === 'confirmed' ? 'A confirmed institutional funding artifact exists.' : 'No confirmed institutional funding artifact exists.',
    },
  };
}

function createLeadIfQualified(companyId: string, profile: Lead['profile']): Lead | null {
  const conditions = formationConditions(companyId, profile);
  if (!Object.values(conditions).every((condition) => condition.passed)) return null;
  const existing = find<Lead>('leads', (lead) => lead.company_id === companyId);
  if (existing) return existing;
  const signals = where<ScoutSignal>('scout_signals', (signal) => signal.company_id === companyId);
  const artifacts = companyArtifacts(companyId);
  const uniqueSources = new Set(signals.map((signal) => signal.source));
  const acceleration = signals.find((signal) => signal.velocity !== null)?.velocity;
  const builderIds = [...new Set(signals.flatMap((signal) => signal.builder_external_ids))];
  const artifactNodes = artifacts.map((artifact) => ({ id: artifact.artifact_id, type: artifact.kind, label: artifact.title }));
  const builderNodes = builderIds.map((builder) => ({ id: builder, type: 'builder', label: builder.replace(/^github:/, '@') }));
  const score = {
    novelty: Math.min(25, 15 + Math.min(10, artifacts.filter((artifact) => Date.parse(artifact.fetched_at) > Date.now() - 30 * DAY).length * 3)),
    corroboration: Math.min(25, uniqueSources.size * 9),
    velocity: acceleration && acceleration.recent_14d > acceleration.prior_14d ? 20 : 0,
    thesis_fit: thesisFit(profile).score,
    evidence_quality: Math.min(10, artifacts.length * 2),
  };
  const company = find<{ company_id: string; canonical_name: string }>('companies', (item) => item.company_id === companyId);
  const lead = append<Lead>('leads', {
    lead_id: id('led'),
    company_id: companyId,
    surfaced_at: now(),
    why_now: `${builderIds.length} identity-linked builders showed accelerating activity and ${uniqueSources.size} independent sources corroborate ${company?.canonical_name ?? 'this company'} before a confirmed institutional round.`,
    conditions,
    score,
    link_graph: {
      nodes: [
        { id: companyId, type: 'company', label: company?.canonical_name ?? companyId },
        ...artifactNodes,
        ...builderNodes,
      ],
      edges: [
        ...artifacts.map((artifact) => ({ from: companyId, to: artifact.artifact_id, via_artifact: artifact.artifact_id })),
        ...builderIds.flatMap((builder) =>
          signals
            .filter((signal) => signal.builder_external_ids.includes(builder))
            .map((signal) => ({ from: builder, to: companyId, via_artifact: signal.artifact_id }))
        ),
      ],
    },
    label: 'reach_out_candidate',
    profile,
  });
  trace({
    agent: 'scout',
    action: 'formation_detector:reach_out_candidate',
    inputs: { artifact_ids: artifacts.map((artifact) => artifact.artifact_id), note: lead.why_now },
    output_refs: [lead.lead_id],
    rule_version: 'formation-detector-v1',
  });
  return lead;
}

function runFormationDetector(profiles: Map<string, Lead['profile']>): number {
  let created = 0;
  for (const [companyId, profile] of profiles) {
    if (createLeadIfQualified(companyId, profile)) created += 1;
  }
  return created;
}

function addDemoCompany(input: {
  name: string;
  domain: string;
  profile: Lead['profile'];
  founder: { name: string; handle: string };
  cofounder: { name: string; handle: string };
}): string {
  const company = ensureCompany(input.name, input.domain);
  const repo = artifactForCompany({
    companyId: company.company_id,
    source: 'github',
    kind: 'repo',
    url: `https://github.com/${input.founder.handle}/${input.domain.split('.')[0]}`,
    title: `${input.name} repository (synthetic Scout demo)`,
    payload: `Synthetic GitHub repository for ${input.name}. Contributors: ${input.founder.handle}, ${input.cofounder.handle}. 12 commits in the last 14 days versus 4 in the prior 14 days.`,
    publishedAt: isoDaysAgo(8),
    synthetic: true,
  });
  const hn = artifactForCompany({
    companyId: company.company_id,
    source: 'hn',
    kind: 'hn_post',
    url: `https://news.ycombinator.com/item?id=${input.domain === 'brightmesh.ai' ? '999001' : '999002'}`,
    title: `Show HN: ${input.name} (synthetic Scout demo)`,
    payload: `Synthetic Show HN linked to https://${input.domain}. ${input.name} has 5 enterprise design partners and is in a top-tier accelerator program.`,
    publishedAt: isoDaysAgo(5),
    synthetic: true,
  });
  const paper = artifactForCompany({
    companyId: company.company_id,
    source: 'arxiv',
    kind: 'arxiv_paper',
    url: `https://arxiv.org/abs/${input.domain === 'brightmesh.ai' ? '2607.00001' : '2607.00002'}`,
    title: `${input.name} technical paper (synthetic Scout demo)`,
    payload: `Synthetic arXiv artifact by ${input.founder.name} and ${input.cofounder.name}, connected to ${input.domain}.`,
    publishedAt: isoDaysAgo(10),
    synthetic: true,
  });
  const funding = artifactForCompany({
    companyId: company.company_id,
    source: 'crunchbase_stub',
    kind: 'funding_stub',
    url: null,
    title: `${input.name} funding snapshot (synthetic stub)`,
    payload: `Synthetic local funding snapshot: no confirmed prior institutional funding event for ${input.name}.`,
    publishedAt: isoDaysAgo(1),
    synthetic: true,
    stub: true,
  });

  const founder = ensurePersonByExternalIdentity({
    name: input.founder.name,
    source: 'github',
    external_id: `github:${input.founder.handle}`,
    url: `https://github.com/${input.founder.handle}`,
    handle: input.founder.handle,
  });
  const cofounder = ensurePersonByExternalIdentity({
    name: input.cofounder.name,
    source: 'github',
    external_id: `github:${input.cofounder.handle}`,
    url: `https://github.com/${input.cofounder.handle}`,
    handle: input.cofounder.handle,
  });
  const founderRole = ensurePersonClaim({
    subjectId: founder.person_id,
    predicate: 'role',
    value: 'technical founder',
    artifactId: repo.artifact_id,
    locator: 'repository contributors',
    quote: `${input.founder.name} is an identity-linked technical founder contributor to ${input.name}.`,
    validAt: isoDaysAgo(8),
    publishedAt: repo.published_at,
  });
  ensureRelationship(founder.person_id, company.company_id, 'founder', founderRole.claim_id);
  const cofounderRole = ensurePersonClaim({
    subjectId: cofounder.person_id,
    predicate: 'role',
    value: 'technical co-founder',
    artifactId: repo.artifact_id,
    locator: 'repository contributors',
    quote: `${input.cofounder.name} is an identity-linked technical co-founder contributor to ${input.name}.`,
    validAt: isoDaysAgo(8),
    publishedAt: repo.published_at,
  });
  ensureRelationship(cofounder.person_id, company.company_id, 'co-founder', cofounderRole.claim_id);
  for (const [predicate, value, quote] of [
    ['technical_work', 'repository activity', `${input.founder.name} shipped verified repository activity.`],
    ['shipping_cadence', '12 commits in 14 days', `${input.founder.name} is linked to 12 commits in the last 14 days versus 4 in the prior window.`],
    ['customer_learning', '5 enterprise design partners', `${input.name} reports five enterprise design partners in its Show HN artifact.`],
  ] as const) {
    ensurePersonClaim({ subjectId: founder.person_id, predicate, value, artifactId: predicate === 'customer_learning' ? hn.artifact_id : repo.artifact_id, locator: predicate === 'customer_learning' ? 'Show HN' : 'repository activity', quote, validAt: isoDaysAgo(5), publishedAt: predicate === 'customer_learning' ? hn.published_at : repo.published_at });
  }
  deriveFounderEvents(founder.person_id, where<Claim>('claims', (claim) => claim.subject_id === founder.person_id));

  ensureClaim({ subjectId: company.company_id, predicate: 'geography', value: input.profile.geography ?? 'not disclosed', artifactId: hn.artifact_id, locator: 'Show HN', quote: `${input.name} is based in ${input.profile.geography ?? 'an undisclosed geography'}.`, validAt: isoDaysAgo(5), publishedAt: hn.published_at });
  ensureClaim({ subjectId: company.company_id, predicate: 'sector', value: input.profile.sectors.join(', '), artifactId: repo.artifact_id, locator: 'repository', quote: `${input.name} builds ${input.profile.sectors.join(', ')} software.`, validAt: isoDaysAgo(8), publishedAt: repo.published_at });
  ensureClaim({ subjectId: company.company_id, predicate: 'enterprise_traction', value: '5 enterprise design partners', artifactId: hn.artifact_id, locator: 'Show HN', quote: `${input.name} has 5 enterprise design partners.`, validAt: isoDaysAgo(5), publishedAt: hn.published_at });
  ensureClaim({ subjectId: company.company_id, predicate: 'prior_institutional_funding', value: false, artifactId: funding.artifact_id, locator: 'funding snapshot', quote: `No confirmed prior institutional funding event for ${input.name}.`, validAt: isoDaysAgo(1), publishedAt: funding.published_at });
  ensureClaim({ subjectId: company.company_id, predicate: 'accelerator_tier', value: 'top-tier accelerator', artifactId: hn.artifact_id, locator: 'Show HN', quote: `${input.name} is in a top-tier accelerator program.`, validAt: isoDaysAgo(5), publishedAt: hn.published_at });

  addSignal({ company_id: company.company_id, artifact_id: repo.artifact_id, source: 'github', kind: 'commit_window', observed_at: now(), event_at: repo.published_at, builder_external_ids: [`github:${input.founder.handle}`, `github:${input.cofounder.handle}`], velocity: { recent_14d: 12, prior_14d: 4 }, tags: input.profile.sectors, funding_status: 'none_confirmed', synthetic: true });
  addSignal({ company_id: company.company_id, artifact_id: hn.artifact_id, source: 'hn', kind: 'show_hn', observed_at: now(), event_at: hn.published_at, builder_external_ids: [], velocity: null, tags: input.profile.sectors, funding_status: 'none_confirmed', synthetic: true });
  addSignal({ company_id: company.company_id, artifact_id: paper.artifact_id, source: 'arxiv', kind: 'paper', observed_at: now(), event_at: paper.published_at, builder_external_ids: [], velocity: null, tags: input.profile.sectors, funding_status: 'none_confirmed', synthetic: true });
  return company.company_id;
}

export function seedScoutDemo(): ScoutRunResult {
  const profiles = new Map<string, Lead['profile']>();
  const brightmesh = addDemoCompany({
    name: 'Brightmesh Systems', domain: 'brightmesh.ai', profile: { sectors: ['AI infrastructure'], stage: 'pre-seed', geography: 'Berlin, Germany', check_size_target: 750_000, summary: 'Observability infrastructure for enterprise ML teams.' }, founder: { name: 'Alina Wei', handle: 'alina-wei' }, cofounder: { name: 'Mateo Ruiz', handle: 'mateo-ruiz' },
  });
  const quarryline = addDemoCompany({
    name: 'Quarryline', domain: 'quarryline.dev', profile: { sectors: ['industrial software'], stage: 'seed', geography: 'London, United Kingdom', check_size_target: 1_500_000, summary: 'Workflow software for industrial maintenance teams.' }, founder: { name: 'Alina Wei', handle: 'alina-wei' }, cofounder: { name: 'Ren Marlow', handle: 'ren-marlow' },
  });
  profiles.set(brightmesh, { sectors: ['AI infrastructure'], stage: 'pre-seed', geography: 'Berlin, Germany', check_size_target: 750_000, summary: 'Observability infrastructure for enterprise ML teams.' });
  profiles.set(quarryline, { sectors: ['industrial software'], stage: 'seed', geography: 'London, United Kingdom', check_size_target: 1_500_000, summary: 'Workflow software for industrial maintenance teams.' });
  const leads = runFormationDetector(profiles);
  return { mode: 'demo', artifacts: 8, signals: 6, leads, source_status: { github: 'ok', hn: 'ok', arxiv: 'ok' }, errors: [] };
}

async function githubJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(url, { headers, next: { revalidate: 0 } });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${(await response.text()).slice(0, 160)}`);
  return response.json() as Promise<T>;
}

async function waitForArxivWindow(): Promise<void> {
  const remaining = ARXIV_MIN_INTERVAL_MS - (Date.now() - lastArxivRequestAt);
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  lastArxivRequestAt = Date.now();
}

async function ingestGitHub(limit: number, profiles: Map<string, Lead['profile']>): Promise<{ artifacts: number; signals: number }> {
  const thesis = activeThesis();
  const topic = thesis.sectors[0] || 'software';
  const createdAfter = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`${topic} created:>=${createdAfter}`)}&sort=updated&order=desc&per_page=${Math.min(limit, 10)}`;
  const result = await githubJson<{ items: GitHubRepo[] }>(url);
  let artifacts = 0;
  let signals = 0;
  for (const repo of result.items.slice(0, limit)) {
    const domain = safeDomain(repo.homepage);
    const company = ensureCompany(repo.owner.login || repo.name, domain);
    const artifact = artifactForCompany({ companyId: company.company_id, source: 'github', kind: 'repo', url: repo.html_url, title: repo.full_name, payload: JSON.stringify({ repository: repo.full_name, description: repo.description, homepage: repo.homepage, created_at: repo.created_at, pushed_at: repo.pushed_at, topics: repo.topics ?? [] }), publishedAt: repo.created_at, synthetic: false });
    artifacts += 1;
    const contributors = await githubJson<{ login: string; id: number; html_url: string }[]>(`https://api.github.com/repos/${encodeURIComponent(repo.full_name)}/contributors?per_page=5`).catch(() => []);
    const builders = contributors.slice(0, 5).map((contributor) => `github:${contributor.id}`);
    for (const contributor of contributors.slice(0, 5)) {
      ensurePersonByExternalIdentity({ name: contributor.login, source: 'github', external_id: `github:${contributor.id}`, url: contributor.html_url, handle: contributor.login });
    }
    addSignal({ company_id: company.company_id, artifact_id: artifact.artifact_id, source: 'github', kind: 'repo', observed_at: now(), event_at: repo.pushed_at ?? repo.created_at, builder_external_ids: builders, velocity: null, tags: repo.topics ?? [topic], funding_status: 'unknown', synthetic: false });
    signals += 1;
    profiles.set(company.company_id, { sectors: repo.topics?.length ? repo.topics : [topic], stage: 'unknown', geography: null, check_size_target: null, summary: repo.description ?? `${repo.full_name} repository` });
  }
  return { artifacts, signals };
}

async function ingestHn(limit: number, profiles: Map<string, Lead['profile']>): Promise<{ artifacts: number; signals: number }> {
  const ids = await (await fetch('https://hacker-news.firebaseio.com/v0/showstories.json', { next: { revalidate: 0 } })).json() as number[];
  let artifacts = 0;
  let signals = 0;
  for (const idValue of ids.slice(0, Math.min(limit * 3, 30))) {
    const item = await (await fetch(`https://hacker-news.firebaseio.com/v0/item/${idValue}.json`, { next: { revalidate: 0 } })).json() as HnItem | null;
    if (!item?.url || !item.title) continue;
    const domain = safeDomain(item.url);
    if (!domain || domain === 'github.com') continue;
    const company = ensureCompany(labelForDomain(domain), domain);
    const publishedAt = item.time ? new Date(item.time * 1000).toISOString() : null;
    const artifact = artifactForCompany({ companyId: company.company_id, source: 'hn', kind: 'hn_post', url: `https://news.ycombinator.com/item?id=${item.id}`, title: item.title, payload: JSON.stringify({ id: item.id, title: item.title, url: item.url, author: item.by ?? null, score: item.score ?? null }), publishedAt, synthetic: false });
    addSignal({ company_id: company.company_id, artifact_id: artifact.artifact_id, source: 'hn', kind: 'show_hn', observed_at: now(), event_at: publishedAt, builder_external_ids: item.by ? [`hn:${item.by}`] : [], velocity: null, tags: [], funding_status: 'unknown', synthetic: false });
    profiles.set(company.company_id, profiles.get(company.company_id) ?? { sectors: [], stage: 'unknown', geography: null, check_size_target: null, summary: item.title });
    artifacts += 1;
    signals += 1;
    if (artifacts >= limit) break;
  }
  return { artifacts, signals };
}

async function ingestArxiv(limit: number): Promise<{ artifacts: number; signals: number }> {
  await waitForArxivWindow();
  const topic = activeThesis().sectors[0]?.replace(/[^a-zA-Z0-9 ]/g, '') || 'artificial intelligence';
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(`all:${topic}`)}&start=0&max_results=${Math.min(limit, 10)}&sortBy=submittedDate&sortOrder=descending`;
  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) throw new Error(`arXiv ${response.status}`);
  const xml = await response.text();
  const entries = xml.split('<entry>').slice(1);
  let artifacts = 0;
  for (const entry of entries.slice(0, limit)) {
    const idMatch = entry.match(/<id>([^<]+)<\/id>/);
    const title = stripXml(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? null;
    const summary = stripXml(entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]);
    if (!idMatch || !title) continue;
    const artifact = artifactForCompany({ companyId: null, source: 'arxiv', kind: 'arxiv_paper', url: idMatch[1], title, payload: JSON.stringify({ title, summary, published }), publishedAt: published, synthetic: false });
    addSignal({ company_id: null, artifact_id: artifact.artifact_id, source: 'arxiv', kind: 'paper', observed_at: now(), event_at: published, builder_external_ids: [], velocity: null, tags: [topic], funding_status: 'unknown', synthetic: false });
    artifacts += 1;
  }
  return { artifacts, signals: artifacts };
}

export async function runLiveScout(limit = 3): Promise<ScoutRunResult> {
  const profiles = new Map<string, Lead['profile']>();
  const source_status: ScoutRunResult['source_status'] = { github: 'skipped', hn: 'skipped', arxiv: 'skipped' };
  const errors: string[] = [];
  let artifacts = 0;
  let signals = 0;
  for (const [source, action] of [
    ['github', () => ingestGitHub(limit, profiles)],
    ['hn', () => ingestHn(limit, profiles)],
    ['arxiv', () => ingestArxiv(limit)],
  ] as const) {
    try {
      const result = await action();
      artifacts += result.artifacts;
      signals += result.signals;
      source_status[source] = 'ok';
    } catch (error) {
      source_status[source] = 'error';
      errors.push(`${source}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const leads = runFormationDetector(profiles);
  trace({ agent: 'scout', action: 'live_ingestion_complete', inputs: { note: `artifacts=${artifacts}; signals=${signals}; leads=${leads}` }, output_refs: [] , rule_version: 'scout-v1' });
  return { mode: 'live', artifacts, signals, leads, source_status, errors };
}

export function scoutView(): { thesis: Thesis; leads: Array<ReturnType<typeof scoreLead> & { company: { canonical_name: string; primary_domain: string | null } | null; founder_memory: ReturnType<typeof founderSnapshot> | null }> } {
  const thesis = activeThesis();
  const leads = all<Lead>('leads')
    .map((lead) => {
      const company = find<{ company_id: string; canonical_name: string; primary_domain: string | null }>('companies', (item) => item.company_id === lead.company_id) ?? null;
      const founderRelation = where<Relationship>('relationships', (relationship) => relationship.company_id === lead.company_id && relationship.role === 'founder')[0];
      return { ...scoreLead(lead, thesis), company, founder_memory: founderRelation ? founderSnapshot(founderRelation.person_id) : null };
    })
    .sort((a, b) => b.total_score - a.total_score || b.surfaced_at.localeCompare(a.surfaced_at));
  return { thesis, leads };
}

export function promoteLead(leadId: string): { opportunity_id: string } {
  const lead = find<Lead>('leads', (item) => item.lead_id === leadId);
  if (!lead) throw new Error(`Unknown lead: ${leadId}`);
  const existing = find<{ opportunity_id: string; company_id: string; entry_point: string }>('opportunities', (opportunity) => opportunity.company_id === lead.company_id && opportunity.entry_point === 'outbound');
  if (existing) return { opportunity_id: existing.opportunity_id };
  const opportunity = createOpportunity(lead.company_id, 'outbound', lead.surfaced_at);
  trace({ agent: 'orchestrator', action: 'lead_promoted_to_screening', opportunity_id: opportunity.opportunity_id, inputs: { note: 'Human manually promoted a reach-out candidate.' }, output_refs: [leadId, opportunity.opportunity_id] });
  return { opportunity_id: opportunity.opportunity_id };
}

