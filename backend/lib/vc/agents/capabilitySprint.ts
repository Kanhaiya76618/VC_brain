import { append, find, id, now, where } from '../store';
import { recordClaim, upsertArtifact } from '../cartographer';
import { trace } from '../trace';
import type { CapabilitySprint, FounderComponent, FounderScoreEvent, Person } from '../schema';

// The Capability Sprint is the cold-start equalizer: a founder with no public
// footprint opts in, completes a 90-minute packet, and is scored blind — the
// evaluator sees a random ID, never school/employer/network data. The result
// appends Founder Score evidence through the same event mechanism as public
// artifacts, so sprint-evidenced and GitHub-evidenced founders are comparable.

const RUBRIC_VERSION = 'sprint-rubric-v1';

// Component → Founder Score component mapping. Delta scales with how far the
// blind score sits from the neutral midpoint.
const COMPONENT_MAP: {
  key: keyof CapabilitySprint['components'];
  founderComponent: FounderComponent;
  max: number;
}[] = [
  { key: 'problem_investigation', founderComponent: 'domain', max: 30 },
  { key: 'work_sample', founderComponent: 'craft', max: 35 },
  { key: 'evidence_calibration', founderComponent: 'integrity', max: 20 },
  { key: 'collaboration_simulation', founderComponent: 'collaboration', max: 15 },
];

export function sprintsForPerson(personId: string): CapabilitySprint[] {
  return where<CapabilitySprint>('capability_sprints', (s) => s.person_id === personId);
}

// Demo mode: simulates a COMPLETED sprint with fixed rubric results, clearly
// labeled simulated. The live workflow (founder submits the packet, blinded
// graders score it) shares this exact data path.
export function runDemoSprint(personId: string): CapabilitySprint {
  const person = find<Person>('persons', (p) => p.person_id === personId);
  if (!person) throw new Error(`Unknown person: ${personId}`);
  const existing = sprintsForPerson(personId);
  if (existing.length > 0) return existing[existing.length - 1];

  const blindId = `SPR-${id('x').slice(2, 8).toUpperCase()}`;
  const components: CapabilitySprint['components'] = {
    problem_investigation: {
      score: 24,
      max: 30,
      note: 'Named a specific ICP and costly workflow; 3 testable assumptions; identified the strongest disconfirming evidence unprompted.',
    },
    work_sample: {
      score: 27,
      max: 35,
      note: 'Technical track: working thin prototype with an explicit architecture trade-off; scoped honestly.',
    },
    evidence_calibration: {
      score: 16,
      max: 20,
      note: 'Labeled 9/10 mixed claims correctly as fact/inference/unknown and named a verifying source for each.',
    },
    collaboration_simulation: {
      score: 11,
      max: 15,
      note: 'Clear async handoff; integrated the imposed constraint without defensiveness.',
    },
  };
  const total = Object.values(components).reduce((s, c) => s + c.score, 0);

  const artifact = upsertArtifact({
    company_id: null,
    source: 'derived',
    kind: 'transcript',
    url: null,
    title: `Capability Sprint packet — blind ID ${blindId} (simulated demo)`,
    payload: [
      `Blind Capability Sprint result for evaluator-visible ID ${blindId}.`,
      `No school, employer, network or follower data was visible during scoring.`,
      ...Object.entries(components).map(
        ([k, c]) => `${k}: ${c.score}/${c.max} — ${c.note}`
      ),
      `Total: ${total}/100 under ${RUBRIC_VERSION}.`,
    ].join('\n'),
    published_at: now(),
    synthetic: true,
    stub: false,
  });

  const claimResult = recordClaim({
    subject_type: 'person',
    subject_id: personId,
    predicate: 'capability_sprint_result',
    value_json: total,
    unit: 'score_0_100',
    period: { start: now().slice(0, 10), end: now().slice(0, 10) },
    basis: 'historical',
    source: {
      artifact_id: artifact.artifact_id,
      locator: 'sprint packet',
      verbatim_quote: `Total: ${total}/100 under ${RUBRIC_VERSION}.`,
    },
    derivation: null,
    extraction_confidence: 1,
    supersedes: null,
    valid_at: now(),
    published_at: now(),
    fetched_at: now(),
    validated_at: null,
  });
  if (!claimResult.ok) throw new Error(claimResult.reason);

  const sprint = append<CapabilitySprint>('capability_sprints', {
    sprint_id: id('spr'),
    person_id: personId,
    blind_id: blindId,
    track: 'technical',
    components,
    total,
    rubric_version: RUBRIC_VERSION,
    simulated: true,
    scored_at: now(),
    evidence_claim_id: claimResult.claim.claim_id,
  });

  for (const { key, founderComponent, max } of COMPONENT_MAP) {
    const pct = components[key].score / max;
    const delta = Math.round((pct - 0.5) * 30);
    const dupe = find<FounderScoreEvent>(
      'founder_score_events',
      (e) =>
        e.person_id === personId &&
        e.component === founderComponent &&
        e.evidence_claim_id === claimResult.claim.claim_id
    );
    if (!dupe) {
      append<FounderScoreEvent>('founder_score_events', {
        event_id: id('fse'),
        person_id: personId,
        component: founderComponent,
        delta,
        evidence_claim_id: claimResult.claim.claim_id,
        note: `Blind Capability Sprint ${key} ${components[key].score}/${max} (${RUBRIC_VERSION})`,
        at: now(),
      });
    }
  }

  trace({
    agent: 'screener',
    action: 'capability_sprint_scored_blind',
    inputs: { note: `blind_id=${blindId}, total=${total}/100, simulated demo` },
    output_refs: [sprint.sprint_id, claimResult.claim.claim_id],
    rule_version: RUBRIC_VERSION,
  });

  return sprint;
}
