import { callClaudeJSON } from '../llm';
import { getStudentContext } from '../orchestrator/knowledgeGraph';

export type FlagType = 'uncited_claim' | 'overclaiming' | 'unreproducible_method' | 'structure';

export interface CritiqueFlag {
  type: FlagType;
  severity: 'low' | 'medium' | 'high';
  excerpt: string;
  note: string;
}

export interface DraftCritique {
  structureSummary: string;
  flags: CritiqueFlag[];
  overallAssessment: string;
}

const SYSTEM = `You are the Critic Agent, coaching a student through their first research paper. Be direct and point at exact sentences from the draft — never give generic advice.

Review the draft for:
- structure: does it have a clear claim, method, evidence, and limitations? Note explicitly what is MISSING.
- uncited_claim: factual or comparative claims stated with no citation.
- overclaiming: language like "proves", "always", "guarantees" that goes beyond the evidence presented.
- unreproducible_method: missing hyperparameters, dataset splits, library versions, or random seeds.

You may receive context about what the student has already studied — use it to make feedback specific to their background.

Respond ONLY with JSON matching:
{ "structureSummary": string, "flags": [{ "type": "uncited_claim" | "overclaiming" | "unreproducible_method" | "structure", "severity": "low" | "medium" | "high", "excerpt": string, "note": string }], "overallAssessment": string }`;

export async function critiqueDraft(draftText: string, studentId: string): Promise<DraftCritique> {
  const context = getStudentContext(studentId);
  const user = `STUDENT CONTEXT: ${context}

DRAFT:
${draftText}`;
  return callClaudeJSON<DraftCritique>({ system: SYSTEM, user, maxTokens: 3000 });
}
