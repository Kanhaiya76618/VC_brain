import { callClaudeJSON } from '../llm';
import { getFullStudentRecord } from '../orchestrator/knowledgeGraph';

export interface PanelVerdict {
  objections: {
    panelist: 'methods_skeptic' | 'impact_skeptic' | 'feasibility_skeptic';
    objection: string;
    severity: 'minor' | 'major' | 'blocking';
  }[];
  verdict: 'fund' | 'revise_and_resubmit' | 'reject';
  revisionPriorities: string[];
  reviewedAt: string;
}

const SYSTEM = `You are a three-member skeptical grant panel reviewing a student's research proposal.

- methods_skeptic attacks vague hypotheses, missing controls, and unmeasurable outcomes.
- impact_skeptic attacks "so what" — overclaimed significance, unclear beneficiaries.
- feasibility_skeptic attacks timeline, resources, and skills — and if the student's archived failures or prior plans (provided below) suggest the proposal repeats a known dead end or skips an identified prerequisite gap, the feasibility_skeptic MUST cite it.

Produce 2-4 objections total, each attributed to a panelist with a severity. verdict is "fund" only if no major or blocking objection remains; otherwise "revise_and_resubmit", or "reject" for fundamentally unsalvageable proposals. revisionPriorities: ordered, concrete actions.

Tone: hard but fair — a panel that wants the student to succeed on resubmission.

Respond ONLY with JSON: { "objections": [{ "panelist": "methods_skeptic" | "impact_skeptic" | "feasibility_skeptic", "objection": string, "severity": "minor" | "major" | "blocking" }], "verdict": "fund" | "revise_and_resubmit" | "reject", "revisionPriorities": string[] }`;

export async function reviewProposal(studentId: string, proposalText: string): Promise<PanelVerdict> {
  const rec = getFullStudentRecord(studentId);

  const archive = rec.archiveEntries.length
    ? rec.archiveEntries
        .map((e) => `Attempted: ${e.attempted} | Failure mode: ${e.failureMode} | Lesson: ${e.lesson}`)
        .join('\n')
    : '(none yet)';

  const plans = rec.plans.length
    ? rec.plans
        .map(
          (p) =>
            `Objective: ${p.objective} | Archive warnings: ${p.archiveWarnings.join('; ') || 'none'} | Prereq gaps: ${p.prereqGaps.join('; ') || 'none'}`
        )
        .join('\n')
    : '(none yet)';

  const user = `PROPOSAL
${proposalText}

ARCHIVED FAILURES
${archive}

PRIOR PLANS
${plans}`;

  const verdict = await callClaudeJSON<Omit<PanelVerdict, 'reviewedAt'>>({
    system: SYSTEM,
    user,
    maxTokens: 2000,
    tier: 'heavy',
  });
  return { ...verdict, reviewedAt: new Date().toISOString() };
}
