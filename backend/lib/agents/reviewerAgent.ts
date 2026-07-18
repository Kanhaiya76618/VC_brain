import { callClaudeJSON } from '../llm';
import { getFullStudentRecord } from '../orchestrator/knowledgeGraph';

export interface ReviewExercise {
  excerpt: string;
  plantedFlaws: {
    flaw: string;
    category: 'uncited_claim' | 'overclaiming' | 'confounded_method' | 'stats_misuse';
  }[];
}

export interface ReviewGrade {
  caught: string[];
  missed: string[];
  falsePositives: string[];
  score: number;
  coaching: string;
  gradedAt: string;
}

const EXERCISE_SYSTEM = `You write a SHORT (150-220 word) fictional paper excerpt containing exactly 3 deliberately planted flaws, drawn from these categories: uncited_claim, overclaiming, confounded_method, stats_misuse.

Rules:
- Realistic academic tone; the flaws must be subtle but findable by a careful reader.
- If the student's learning-path node titles are provided, set the excerpt in that subject area so the exercise matches what they study.
- Never reveal or hint at the flaws inside the excerpt itself.
- Fictional content only — invent authors, systems, and datasets. No real papers or real researchers' names.

Respond ONLY with JSON: { "excerpt": string, "plantedFlaws": [{ "flaw": string, "category": "uncited_claim" | "overclaiming" | "confounded_method" | "stats_misuse" }] }`;

const GRADE_SYSTEM = `You grade a student's written review of a fictional excerpt against the planted flaws provided.

- caught: planted flaws the review identified (paraphrase is fine — judge by substance).
- missed: planted flaws the review did not identify.
- falsePositives: things the review flagged that were not planted and are not genuine flaws of the excerpt.
- score: caught.length divided by the number of planted flaws, rounded to 2 decimals.
- coaching: 2-3 sentences on what kind of flaw this student systematically misses, based on the pattern.

Respond ONLY with JSON: { "caught": string[], "missed": string[], "falsePositives": string[], "score": number, "coaching": string }`;

export async function generateExercise(studentId: string, topicHint?: string): Promise<ReviewExercise> {
  const rec = getFullStudentRecord(studentId);
  const nodeTitles = rec.learningPaths.flatMap((lp) => lp.nodes.map((n) => n.title));

  const user = `TOPIC HINT: ${topicHint?.trim() || '(none)'}

STUDENT'S LEARNING PATH NODES
${nodeTitles.length ? nodeTitles.join('\n') : '(none yet)'}`;

  return callClaudeJSON<ReviewExercise>({ system: EXERCISE_SYSTEM, user, maxTokens: 2000 });
}

export async function gradeReview(exercise: ReviewExercise, studentReview: string): Promise<ReviewGrade> {
  const user = `EXCERPT
${exercise.excerpt}

PLANTED FLAWS
${exercise.plantedFlaws.map((f, i) => `${i + 1}. [${f.category}] ${f.flaw}`).join('\n')}

STUDENT REVIEW
${studentReview}`;

  const graded = await callClaudeJSON<Omit<ReviewGrade, 'gradedAt'>>({
    system: GRADE_SYSTEM,
    user,
    maxTokens: 1500,
  });
  return { ...graded, gradedAt: new Date().toISOString() };
}
