import { callClaudeJSON } from '../llm';
import { getFullStudentRecord } from '../orchestrator/knowledgeGraph';

export interface ArchiveEntry {
  attempted: string;
  outcome: string;
  hypothesis: string;
  failureMode: string;
  lesson: string;
  similarPriorAttempts: string[];
  loggedAt: string;
}

const SYSTEM = `You are the Archivist Agent for a Negative Results Archive. A student logs an experiment that failed. Your job is to make the failure reusable, not to console.

Produce:
- failureMode: one short, specific phrase categorizing WHY it failed (e.g. "confounded baseline", "insufficient data scale"). Never vague like "it didn't work".
- lesson: 1-2 sentences on what a future attempt should do differently.
- similarPriorAttempts: from the student's OWN prior logged attempts provided below, list the "attempted" text of any that share the same failure mode or root cause. Empty array if none — never force a match.

Respond ONLY with JSON: { "failureMode": string, "lesson": string, "similarPriorAttempts": string[] }`;

export async function logExperiment(
  studentId: string,
  entry: { attempted: string; outcome: string; hypothesis: string }
): Promise<ArchiveEntry> {
  const record = getFullStudentRecord(studentId);
  const prior = record.archiveEntries;
  const priorList = prior.length
    ? prior
        .map((e: any, i: number) => `${i + 1}. Attempted: ${e.attempted} | Failure mode: ${e.failureMode}`)
        .join('\n')
    : '(none yet)';

  const user = `NEW FAILED EXPERIMENT
Attempted: ${entry.attempted}
Hypothesis: ${entry.hypothesis}
Outcome: ${entry.outcome}

PRIOR LOGGED ATTEMPTS
${priorList}`;

  const analyzed = await callClaudeJSON<{
    failureMode: string;
    lesson: string;
    similarPriorAttempts: string[];
  }>({ system: SYSTEM, user, maxTokens: 1500 });

  return { ...entry, ...analyzed, loggedAt: new Date().toISOString() };
}
