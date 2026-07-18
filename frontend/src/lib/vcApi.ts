// Typed client for the VC Brain backend (proxied to :4029 via next.config rewrites).

export interface Timestamps4 {
  valid_at: string | null;
  published_at: string | null;
  fetched_at: string;
  validated_at: string | null;
}

export interface Artifact {
  artifact_id: string;
  source: string;
  kind: string;
  url: string | null;
  title: string;
  published_at: string | null;
  fetched_at: string;
  synthetic: boolean;
  stub: boolean;
}

export interface EvidenceAssessment {
  claim_id: string;
  provenance: number;
  directness: number;
  reliability: number;
  recency: number;
  agreement: number;
  conflict_penalty: number;
  trust: number;
  band: 'verified' | 'corroborated' | 'founder_stated' | 'weak_or_disputed';
  rule_version: string;
}

export interface Validation {
  validation_id: string;
  claim_id: string;
  verdict: 'supported' | 'partly_supported' | 'contradicted' | 'insufficient_evidence';
  method: string;
  evidence: { artifact_id?: string; url?: string; snippet: string }[];
  shown_calculation: string | null;
  validated_at: string;
}

export interface Claim extends Timestamps4 {
  claim_id: string;
  subject_type: 'person' | 'company' | 'opportunity';
  subject_id: string;
  predicate: string;
  value_json: unknown;
  unit: string | null;
  period: { start: string; end: string } | null;
  basis: 'historical' | 'projected' | null;
  source: { artifact_id: string; locator: string; verbatim_quote: string };
  derivation: { method: string; from_claim_ids: string[]; calculation: string } | null;
  extraction_confidence: number;
  assessment: EvidenceAssessment | null;
  validations: Validation[];
  artifact: Artifact | null;
}

export interface Contradiction {
  contradiction_id: string;
  claim_ids: [string, string];
  rule: string;
  severity: 'minor' | 'material' | 'hard';
  domain: string;
  detail: string;
  llm_reconciliation_note: string | null;
  status: 'open' | 'explained';
  detected_at: string;
  rule_version: string;
}

export interface Subscore {
  name: string;
  weight: number;
  value: number | null;
  rationale: string;
  evidence_claim_ids: string[];
}

export interface AxisScore {
  axis: 'founder' | 'market' | 'idea_market';
  score: number | null;
  coverage: number;
  band: [number, number];
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_history';
  market_label?: 'bull' | 'neutral' | 'bear';
  subscores: Subscore[];
  rule_version: string;
  computed_at: string;
}

export interface FounderScoreSnapshot {
  person_id: string;
  total: number | null;
  coverage: number;
  band: [number, number];
  components: Record<string, { value: number; weight: number; evidence_count: number }>;
}

export interface PersonView {
  person_id: string;
  canonical_name: string;
  founder_score: FounderScoreSnapshot;
}

export interface StageTransition {
  opportunity_id: string;
  from: string | null;
  to: string;
  at: string;
  actor: 'system' | 'human';
}

export interface RoutingDecision {
  route: 'advance' | 'founder_call_pivot' | 'request_evidence' | 'hold';
  matrix_rule: string;
  proposed_check: string | null;
  decided_at: string;
}

export interface MemoSection {
  title: string;
  sentences: { text: string; claim_ids: string[] }[];
}

export interface Memo {
  memo_id: string;
  sections: MemoSection[];
  hypotheses: { statement: string; falsifier: string; claim_ids: string[] }[];
  missing: string[];
  generated_at: string;
}

export interface PipelineMetrics {
  opportunities: number;
  decided: number;
  median_signal_to_decision_ms: number | null;
  decided_within_24h: number;
  bottleneck: { stage: string; median_dwell_ms: number } | null;
}

export interface OpportunityView {
  opportunity: { opportunity_id: string; company_id: string; entry_point: 'inbound' | 'outbound' };
  company: { company_id: string; canonical_name: string; primary_domain: string | null } | null;
  stage: 'sourcing' | 'screening' | 'diligence' | 'decision';
  transitions: StageTransition[];
  persons: PersonView[];
  claims: Claim[];
  contradictions: Contradiction[];
  axes: AxisScore[];
  routing: RoutingDecision | null;
  memo: Memo | null;
  metrics: PipelineMetrics;
}

export interface PipelineView {
  metrics: PipelineMetrics;
  opportunities: {
    opportunity_id: string;
    entry_point: 'inbound' | 'outbound';
    company: { canonical_name: string; primary_domain: string | null } | null;
    stage: 'sourcing' | 'screening' | 'diligence' | 'decision';
    routing: RoutingDecision | null;
    transitions: StageTransition[];
  }[];
}

export interface TraceEvent {
  trace_id: string;
  opportunity_id: string | null;
  agent: string;
  action: string;
  inputs: { query?: string; urls?: string[]; artifact_ids?: string[]; claim_ids?: string[]; note?: string };
  output_refs: string[];
  rule_version: string;
  at: string;
}

export interface Thesis {
  thesis_id: string;
  name: string;
  active: boolean;
  sectors: string[];
  stages: string[];
  geographies: string[];
  check_size: { min: number; max: number; currency: string };
  ownership_target: number;
  risk_appetite: 'low' | 'medium' | 'high';
}

export type ThesisInput = Omit<Thesis, 'thesis_id' | 'active'>;

export interface FormationCondition {
  passed: boolean;
  evidence_refs: string[];
  note: string;
}

export interface ScoutLead {
  lead_id: string;
  surfaced_at: string;
  why_now: string;
  label: 'reach_out_candidate';
  profile: { sectors: string[]; stage: string; geography: string | null; check_size_target: number | null; summary: string };
  score: { novelty: number; corroboration: number; velocity: number; thesis_fit: number; evidence_quality: number };
  total_score: number;
  thesis_fit: { score: number; matched: string[]; unmatched: string[] };
  conditions: Record<string, FormationCondition>;
  link_graph: { nodes: { id: string; type: string; label: string }[]; edges: { from: string; to: string; via_artifact: string }[] };
  company: { canonical_name: string; primary_domain: string | null } | null;
  founder_memory: FounderScoreSnapshot | null;
}

export interface ScoutView {
  thesis: Thesis;
  leads: ScoutLead[];
}

export interface ScoutRun {
  mode: 'demo' | 'live';
  artifacts: number;
  signals: number;
  leads: number;
  source_status: Record<'github' | 'hn' | 'arxiv', 'ok' | 'skipped' | 'error'>;
  errors: string[];
}

export interface GraphQueryResult {
  company: { company_id: string; canonical_name: string; primary_domain: string | null };
  matched: { clause: { key: string; label: string; value: string | null }; evidence: { claim_id: string; predicate: string; value: unknown; quote: string; artifact: { title: string; url: string | null; fetched_at: string } | null } }[];
  missing: { key: string; label: string; value: string | null }[];
  score: number;
}

export interface GraphQueryResponse {
  query: string;
  clauses: { key: string; label: string; value: string | null }[];
  results: GraphQueryResult[];
  near_misses: GraphQueryResult[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.error === 'string') message = data.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function getPipeline(): Promise<PipelineView> {
  return request<PipelineView>('/api/vc/pipeline');
}

export function getOpportunity(id: string): Promise<OpportunityView> {
  return request<OpportunityView>(`/api/vc/opportunity/${id}`);
}

export function getTrace(opportunityId: string): Promise<{ events: TraceEvent[] }> {
  return request<{ events: TraceEvent[] }>(`/api/vc/trace/${opportunityId}`);
}

export function seedDemo(): Promise<{ opportunity_id: string }> {
  return request<{ opportunity_id: string }>('/api/vc/seed', { method: 'POST' });
}

export function runDiligence(opportunityId: string): Promise<OpportunityView> {
  return request<OpportunityView>('/api/vc/diligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ opportunityId }),
  });
}

export async function downloadMemoPdf(opportunityId: string): Promise<Blob> {
  const res = await fetch('/api/vc/memo/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ opportunityId }),
  });
  if (!res.ok) throw new Error(`PDF export failed (${res.status})`);
  return res.blob();
}

export function fmtDuration(ms: number | null): string {
  if (ms === null) return '—';
  const hours = ms / 3600000;
  if (hours < 1) return `${Math.round(ms / 60000)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function getScout(): Promise<ScoutView> {
  return request<ScoutView>('/api/vc/scout');
}

export function runScout(mode: 'demo' | 'live'): Promise<{ run: ScoutRun; view: ScoutView }> {
  return request('/api/vc/scout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) });
}

export function promoteLead(leadId: string): Promise<{ opportunity_id: string }> {
  return request(`/api/vc/leads/${leadId}/promote`, { method: 'POST' });
}

export function getThesis(): Promise<{ thesis: Thesis }> {
  return request('/api/vc/thesis');
}

export function saveThesis(input: ThesisInput): Promise<{ thesis: Thesis }> {
  return request('/api/vc/thesis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export function queryEvidenceGraph(query: string): Promise<GraphQueryResponse> {
  return request('/api/vc/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
}

export interface OutreachDraft {
  draft_id: string;
  lead_id: string;
  subject: string;
  body: string;
  cited_artifact_ids: string[];
  status: 'draft' | 'approved_by_human' | 'sent';
}

export function getOutreachDrafts(leadId: string): Promise<{ drafts: OutreachDraft[] }> {
  return request(`/api/vc/outreach?leadId=${encodeURIComponent(leadId)}`);
}

export function draftOutreach(leadId: string): Promise<{ draft: OutreachDraft }> {
  return request('/api/vc/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId }) });
}

export function approveOutreach(draftId: string): Promise<{ draft: OutreachDraft }> {
  return request(`/api/vc/outreach/${draftId}/approve`, { method: 'POST' });
}

export function sendOutreach(draftId: string, toEmail: string): Promise<{ id: string | null }> {
  return request(`/api/vc/outreach/${draftId}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toEmail }) });
}
