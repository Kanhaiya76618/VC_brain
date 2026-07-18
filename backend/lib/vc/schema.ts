// VC Brain evidence-graph schema. Append-only: rows are never mutated in
// place — corrections append a new row whose `supersedes` points at the old one.

export interface Timestamps4 {
  valid_at: string | null; // when the fact was true in the world (event time)
  published_at: string | null; // when the source published it
  fetched_at: string; // when we retrieved it
  validated_at: string | null; // when the Validator last assessed it
}

export type Source =
  | 'github'
  | 'hn'
  | 'arxiv'
  | 'domain'
  | 'deck'
  | 'website'
  | 'transcript'
  | 'crunchbase_stub'
  | 'market_benchmark_stub'
  | 'derived';

export interface Person {
  person_id: string;
  canonical_name: string;
  normalized_name: string;
}

export interface Company {
  company_id: string;
  canonical_name: string;
  primary_domain: string | null;
}

export interface ExternalIdentity {
  identity_id: string;
  owner_type: 'person' | 'company';
  owner_id: string;
  source: Source;
  external_id: string;
  url: string | null;
  handle: string | null;
  match_basis: 'strong_key' | 'document_anchor' | 'auto_merge' | 'human_merge';
}

export type ArtifactKind =
  | 'repo'
  | 'release'
  | 'commit_window'
  | 'hn_post'
  | 'arxiv_paper'
  | 'pitch_deck'
  | 'website_snapshot'
  | 'transcript'
  | 'funding_stub'
  | 'market_benchmark';

export interface Artifact {
  artifact_id: string;
  company_id: string | null; // scoped when the artifact is known to concern one company
  source: Source;
  kind: ArtifactKind;
  url: string | null;
  title: string;
  raw_hash: string;
  payload_path: string;
  published_at: string | null;
  fetched_at: string;
  synthetic: boolean;
  stub: boolean;
}

export interface ClaimSourceRef {
  artifact_id: string;
  locator: string; // "slide 4", "about page", "README line 12"
  verbatim_quote: string;
}

export interface ClaimDerivation {
  method: string; // "mrr_x12_from_cohorts"
  from_claim_ids: string[];
  calculation: string; // human-readable arithmetic, rendered in the UI
}

export interface Claim extends Timestamps4 {
  claim_id: string;
  subject_type: 'person' | 'company' | 'opportunity';
  subject_id: string;
  predicate: string;
  value_json: unknown;
  unit: string | null; // required for numeric claims
  period: { start: string; end: string } | null; // required for numeric claims
  basis: 'historical' | 'projected' | null; // projected barred from traction scoring
  source: ClaimSourceRef;
  derivation: ClaimDerivation | null;
  extraction_confidence: number; // 0-1
  supersedes: string | null;
}

export type TrustBand = 'verified' | 'corroborated' | 'founder_stated' | 'weak_or_disputed';

export interface EvidenceAssessment {
  assessment_id: string;
  claim_id: string;
  provenance: number; // 0-1
  directness: number; // 0-1
  reliability: number; // 0-1
  recency: number; // 0-1
  agreement: number; // 0-1
  conflict_penalty: number; // 0-30
  trust: number; // 0-100
  band: TrustBand;
  rule_version: string;
  computed_at: string;
}

export type ValidationVerdict =
  | 'supported'
  | 'partly_supported'
  | 'contradicted'
  | 'insufficient_evidence';

export interface Validation {
  validation_id: string;
  claim_id: string;
  verdict: ValidationVerdict;
  method: string;
  evidence: { artifact_id?: string; url?: string; snippet: string }[];
  shown_calculation: string | null;
  validated_at: string;
}

export type ContradictionRule =
  | 'value_tolerance'
  | 'unit_mismatch'
  | 'period_mismatch'
  | 'temporal_order'
  | 'role_overlap'
  | 'entity_identity'
  | 'scope_confusion';

export interface Contradiction {
  contradiction_id: string;
  claim_ids: [string, string];
  rule: ContradictionRule;
  severity: 'minor' | 'material' | 'hard';
  domain: 'identity' | 'revenue' | 'market' | 'technology' | 'other';
  detail: string;
  llm_reconciliation_note: string | null; // an LLM may explain, never dismiss
  status: 'open' | 'explained';
  detected_at: string;
  rule_version: string;
}

export interface Relationship {
  relationship_id: string;
  person_id: string;
  company_id: string;
  role: string;
  valid_from: string | null;
  valid_to: string | null;
  evidence_claim_id: string;
}

export interface MergeCandidate {
  candidate_id: string;
  a: { type: 'person' | 'company'; id: string };
  b: { type: 'person' | 'company'; id: string };
  score: number; // rule-based match score, not a trained probability
  features: Record<string, number>;
  status: 'auto_merged' | 'queued_for_review' | 'kept_separate' | 'human_merged' | 'human_rejected';
}

export type Stage = 'sourcing' | 'screening' | 'diligence' | 'decision';
export type TransitionPoint = 'first_signal' | 'ingested' | 'screened' | 'diligence' | 'decision';

export interface Opportunity {
  opportunity_id: string;
  company_id: string;
  entry_point: 'inbound' | 'outbound';
}

export interface StageTransition {
  transition_id: string;
  opportunity_id: string;
  from: TransitionPoint | null;
  to: TransitionPoint;
  at: string;
  actor: 'system' | 'human';
}

export type AgentName =
  | 'scout'
  | 'cartographer'
  | 'extractor'
  | 'validator'
  | 'adjudicator'
  | 'screener'
  | 'memo'
  | 'activator'
  | 'orchestrator';

export interface TraceEvent {
  trace_id: string;
  opportunity_id: string | null;
  agent: AgentName;
  action: string;
  inputs: {
    query?: string;
    urls?: string[];
    artifact_ids?: string[];
    claim_ids?: string[];
    note?: string;
  };
  output_refs: string[];
  rule_version: string;
  at: string;
}

export type FounderComponent =
  | 'execution' // verified execution record, weight 22
  | 'domain' // problem/domain understanding, 15
  | 'craft' // technical/product craft, 13
  | 'learning_velocity' // 13
  | 'customer_learning' // 12
  | 'collaboration' // 10
  | 'integrity' // 8
  | 'prior_outcomes'; // 7 — missing = neutral, never negative

export interface FounderScoreEvent {
  event_id: string;
  person_id: string;
  component: FounderComponent;
  delta: number;
  evidence_claim_id: string;
  note: string;
  at: string;
}

export interface FounderScoreSnapshot {
  person_id: string;
  total: number | null; // null when coverage < 0.5 → UI shows "not enough evidence"
  coverage: number;
  band: [number, number];
  components: Record<FounderComponent, { value: number; weight: number; evidence_count: number }>;
  computed_at: string;
}

export type Axis = 'founder' | 'market' | 'idea_market';
export type Trend = 'improving' | 'declining' | 'stable' | 'insufficient_history';

export interface Subscore {
  name: string;
  weight: number; // fraction, sums to 1 per axis
  value: number | null; // null = no evidence → excluded, not zero
  rationale: string;
  evidence_claim_ids: string[];
}

export interface AxisScore {
  axis_score_id: string;
  opportunity_id: string;
  axis: Axis;
  score: number | null; // null when coverage < 0.5
  coverage: number;
  band: [number, number];
  trend: Trend;
  market_label?: 'bull' | 'neutral' | 'bear';
  subscores: Subscore[];
  rule_version: string;
  computed_at: string;
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

export interface Lead {
  lead_id: string;
  company_id: string;
  surfaced_at: string;
  why_now: string; // one sentence, mandatory
  conditions: Record<
    'a_linked_builders' | 'b_cross_source' | 'c_velocity' | 'd_thesis_fit' | 'e_no_prior_funding',
    { passed: boolean; evidence_refs: string[]; note: string }
  >;
  score: {
    novelty: number; // /25
    corroboration: number; // /25
    velocity: number; // /20
    thesis_fit: number; // /20
    evidence_quality: number; // /10
  };
  link_graph: {
    nodes: { id: string; type: string; label: string }[];
    edges: { from: string; to: string; via_artifact: string }[];
  };
  label: 'reach_out_candidate';
  profile: {
    sectors: string[];
    stage: string;
    geography: string | null;
    check_size_target: number | null;
    summary: string;
  };
}

// A Scout signal is the typed, inspectable input to the formation detector.
// It deliberately stores observed facts rather than a model's interpretation.
export interface ScoutSignal {
  signal_id: string;
  company_id: string | null;
  artifact_id: string;
  source: 'github' | 'hn' | 'arxiv';
  kind: 'repo' | 'release' | 'commit_window' | 'show_hn' | 'paper';
  observed_at: string;
  event_at: string | null;
  builder_external_ids: string[];
  velocity: { recent_14d: number; prior_14d: number } | null;
  tags: string[];
  funding_status: 'none_confirmed' | 'confirmed' | 'unknown';
  synthetic: boolean;
}

export interface OutreachDraft {
  draft_id: string;
  lead_id: string;
  subject: string;
  body: string;
  cited_artifact_ids: string[];
  status: 'draft' | 'approved_by_human' | 'sent';
}

export interface MemoSentence {
  text: string;
  claim_ids: string[]; // evidence chips; sentences with facts must have ≥1
}

export interface MemoSection {
  title:
    | 'Company snapshot'
    | 'Investment hypotheses'
    | 'SWOT'
    | 'Problem & product'
    | 'Traction & KPIs';
  sentences: MemoSentence[];
}

export interface Memo {
  memo_id: string;
  opportunity_id: string;
  sections: MemoSection[];
  hypotheses: { statement: string; falsifier: string; claim_ids: string[] }[];
  missing: string[]; // "Cap table: not disclosed" — flagged, never fabricated
  generated_at: string;
}

export type DecisionRoute = 'advance' | 'founder_call_pivot' | 'request_evidence' | 'hold';

export interface RoutingDecision {
  routing_id: string;
  opportunity_id: string;
  route: DecisionRoute;
  matrix_rule: string; // which matrix row fired, verbatim
  proposed_check: string | null;
  decided_at: string;
}
