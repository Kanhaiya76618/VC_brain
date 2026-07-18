import { callClaudeJSON } from '../llm';
import { getFullStudentRecord } from '../orchestrator/knowledgeGraph';

export interface SupervisorReport {
  consistencyNotes: string[];
  suggestions: string[];
  overallNarrative: string;
  generatedAt: string;
}

const SYSTEM = `You are the Supervisor Agent. You do no work yourself — you read what the other agents produced (learning paths, draft critiques, archive entries) and check it AS A WHOLE, like an advisor reviewing a student's full research trail.

- consistencyNotes: concrete cross-references only (e.g. "the draft claims a speedup but the Archive shows the same method failed for that reason", "the draft uses terminology from a paper not in any learning path"). If only one module has data, say plainly there is nothing to cross-reference yet — never invent connections.
- suggestions: concrete next actions tied to the actual record.
- overallNarrative: 3-4 sentences addressed to the student directly ("you've..."), specific — reference real paper titles and failure modes, no generic cheerleading.

Respond ONLY with JSON: { "consistencyNotes": string[], "suggestions": string[], "overallNarrative": string }`;

export async function synthesize(studentId: string): Promise<SupervisorReport> {
  const rec = getFullStudentRecord(studentId);

  const paths = rec.learningPaths.length
    ? rec.learningPaths
        .map((lp) => `Target: ${lp.targetTitle}\nNodes: ${lp.nodes.map((n) => n.title).join('; ')}`)
        .join('\n\n')
    : '(none yet)';

  const critiques = rec.critiques.length
    ? rec.critiques
        .map(
          (c) =>
            `Structure: ${c.structureSummary}\nFlags: ${c.flags
              .map((f) => `${f.type} (${f.severity})`)
              .join(', ')}`
        )
        .join('\n\n')
    : '(none yet)';

  const archive = rec.archiveEntries.length
    ? rec.archiveEntries
        .map((e) => `Attempted: ${e.attempted} | Failure mode: ${e.failureMode} | Lesson: ${e.lesson}`)
        .join('\n')
    : '(none yet)';

  const plans = rec.plans.length
    ? rec.plans
        .map(
          (p) =>
            `Objective: ${p.objective} | Archive warnings: ${p.archiveWarnings.length} | Prereq gaps: ${p.prereqGaps.length}`
        )
        .join('\n')
    : '(none yet)';

  const reviews = rec.reviewGrades.length
    ? rec.reviewGrades
        .map((g) => `Score: ${g.score} | Missed flaws: ${g.missed.length}`)
        .join('\n')
    : '(none yet)';

  const verdicts = rec.panelVerdicts.length
    ? rec.panelVerdicts
        .map(
          (v) =>
            `Verdict: ${v.verdict} | Blocking: ${v.objections.filter((o) => o.severity === 'blocking').length} | Major: ${v.objections.filter((o) => o.severity === 'major').length}`
        )
        .join('\n')
    : '(none yet)';

  const user = `LEARNING PATHS
${paths}

DRAFT CRITIQUES
${critiques}

ARCHIVE ENTRIES
${archive}

PLANS
${plans}

REVIEW EXERCISES
${reviews}

PANEL VERDICTS
${verdicts}`;

  const report = await callClaudeJSON<Omit<SupervisorReport, 'generatedAt'>>({
    system: SYSTEM,
    user,
    maxTokens: 2000,
    tier: 'heavy',
  });
  return { ...report, generatedAt: new Date().toISOString() };
}
