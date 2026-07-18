import { callClaudeJSON } from '../llm';
import { getFullStudentRecord } from '../orchestrator/knowledgeGraph';

export interface ExperimentPlan {
  objective: string;
  plannedApproach: string;
  milestones: string[];
  controls: string[];
  successCriteria: string[];
  archiveWarnings: string[];
  prereqGaps: string[];
  createdAt: string;
}

const SYSTEM = `You are the Planner Agent, a pre-registration coach. A student proposes an experiment BEFORE running it. Your job is to turn the proposal into a disciplined plan and catch problems before any compute is spent.

Produce:
- milestones: ordered, small steps toward the objective.
- controls: what comparison or baseline makes the eventual result interpretable.
- successCriteria: measurable, falsifiable criteria — reject vague ones like "works better" by restating them measurably.
- archiveWarnings: cross-check the proposal against the student's logged failed attempts provided below. Where the planned approach plausibly shares a root cause with a past failure, warn and cite the past attempt's text verbatim. Empty array if none genuinely match — never force it.
- prereqGaps: methods or concepts the plan relies on that appear in NONE of the student's learning-path node titles provided below. Name what to study. Empty array if covered.

Respond ONLY with JSON: { "milestones": string[], "controls": string[], "successCriteria": string[], "archiveWarnings": string[], "prereqGaps": string[] }`;

export async function planExperiment(
  studentId: string,
  proposal: { objective: string; plannedApproach: string; constraints?: string }
): Promise<ExperimentPlan> {
  const rec = getFullStudentRecord(studentId);

  const archiveList = rec.archiveEntries.length
    ? rec.archiveEntries
        .map((e) => `Attempted: ${e.attempted} | Failure mode: ${e.failureMode} | Lesson: ${e.lesson}`)
        .join('\n')
    : '(none yet)';

  const nodeTitles = rec.learningPaths.flatMap((lp) => lp.nodes.map((n) => n.title));
  const nodesList = nodeTitles.length ? nodeTitles.join('\n') : '(none yet)';

  const user = `PROPOSAL
Objective: ${proposal.objective}
Planned approach: ${proposal.plannedApproach}
Constraints: ${proposal.constraints?.trim() || '(none stated)'}

ARCHIVE ENTRIES
${archiveList}

LEARNING PATH NODES
${nodesList}`;

  const analyzed = await callClaudeJSON<
    Omit<ExperimentPlan, 'objective' | 'plannedApproach' | 'createdAt'>
  >({ system: SYSTEM, user, maxTokens: 2500, tier: 'heavy' });

  return {
    objective: proposal.objective,
    plannedApproach: proposal.plannedApproach,
    ...analyzed,
    createdAt: new Date().toISOString(),
  };
}
