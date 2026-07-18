import { callClaudeJSON } from '../llm';
import { fetchArxivPaper } from '../tools/arxiv';
import { fetchReferences } from '../tools/semanticScholar';

export interface LearningNode {
  order: number;
  title: string;
  arxivId: string | null;
  whyItMatters: string;
  comprehensionGate: string;
  reimplementationTask: string;
}

export interface LearningPath {
  targetTitle: string;
  targetArxivId: string;
  nodes: LearningNode[];
}

const SYSTEM = `You are the Curriculum Agent. Given a target paper and candidate cited papers, build a BACKWARD citation learning path: the prerequisite papers a student should study, ordered most-foundational first to most-advanced last. Select ONLY the references actually necessary to understand the target — not all of them.

For each node provide:
- whyItMatters: 1-2 specific sentences on what concept this paper contributes to understanding the target paper.
- comprehensionGate: ONE understanding question answerable from the paper's abstract. Never a recall question like "what is the title".
- reimplementationTask: a coding task scoped to a few hours that implements that paper's key mechanism in isolation.

Respond ONLY with JSON matching:
{ "targetTitle": string, "targetArxivId": string, "nodes": [{ "order": number, "title": string, "arxivId": string | null, "whyItMatters": string, "comprehensionGate": string, "reimplementationTask": string }] }`;

export async function buildLearningPath(arxivUrlOrId: string): Promise<LearningPath> {
  const paper = await fetchArxivPaper(arxivUrlOrId);
  const refs = await fetchReferences(paper.arxivId, 10);

  if (refs.length === 0) {
    return {
      targetTitle: paper.title,
      targetArxivId: paper.arxivId,
      nodes: [
        {
          order: 1,
          title: paper.title,
          arxivId: paper.arxivId,
          whyItMatters:
            'No usable cited references were found, so the path starts directly at the target paper itself.',
          comprehensionGate:
            'Based on the abstract, what problem does this paper address and what is its core proposed approach?',
          reimplementationTask:
            'Implement a minimal toy version of the core mechanism described in the abstract, on synthetic data.',
        },
      ],
    };
  }

  const user = `TARGET PAPER
Title: ${paper.title}
Abstract: ${paper.summary}

CANDIDATE CITED PAPERS
${refs
  .map(
    (r, i) =>
      `${i + 1}. ${r.title} (${r.year ?? 'year unknown'}, arxivId: ${r.arxivId ?? 'none'})
Abstract: ${r.abstract}`
  )
  .join('\n\n')}`;

  const path = await callClaudeJSON<LearningPath>({ system: SYSTEM, user, maxTokens: 4000 });
  path.targetTitle = paper.title;
  path.targetArxivId = paper.arxivId;
  return path;
}
