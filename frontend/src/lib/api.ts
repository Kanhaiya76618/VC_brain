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

export interface ArchiveEntry {
  attempted: string;
  outcome: string;
  hypothesis: string;
  failureMode: string;
  lesson: string;
  similarPriorAttempts: string[];
  loggedAt: string;
}

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

export interface SupervisorReport {
  consistencyNotes: string[];
  suggestions: string[];
  overallNarrative: string;
  generatedAt: string;
}

async function postRaw(path: string, body: unknown): Promise<Response> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.error === 'string') message = data.error;
    } catch {
      // non-JSON error body; keep the status message
    }
    throw new Error(message);
  }
  return res;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return (await postRaw(path, body)).json() as Promise<T>;
}

export function generateCurriculum(arxivUrl: string, studentId: string): Promise<LearningPath> {
  return post<LearningPath>('/api/curriculum', { arxivUrl, studentId });
}

export function critiqueDraft(draftText: string, studentId: string): Promise<DraftCritique> {
  return post<DraftCritique>('/api/critique', { draftText, studentId });
}

export function logExperiment(input: {
  attempted: string;
  outcome: string;
  hypothesis: string;
  studentId: string;
}): Promise<ArchiveEntry> {
  return post<ArchiveEntry>('/api/archive', input);
}

export function planExperiment(input: {
  objective: string;
  plannedApproach: string;
  constraints?: string;
  studentId: string;
}): Promise<ExperimentPlan> {
  return post<ExperimentPlan>('/api/plan', input);
}

export function generateReviewExercise(studentId: string, topicHint?: string): Promise<ReviewExercise> {
  return post<ReviewExercise>('/api/review/exercise', { studentId, topicHint });
}

export function gradeReview(
  exercise: ReviewExercise,
  studentReview: string,
  studentId: string
): Promise<ReviewGrade> {
  return post<ReviewGrade>('/api/review/grade', { exercise, studentReview, studentId });
}

export function reviewProposal(proposalText: string, studentId: string): Promise<PanelVerdict> {
  return post<PanelVerdict>('/api/proposal-review', { proposalText, studentId });
}

export function getSupervisorReport(studentId: string): Promise<SupervisorReport> {
  return post<SupervisorReport>('/api/supervisor', { studentId });
}

export async function downloadReportPdf(studentId: string): Promise<Blob> {
  const res = await postRaw('/api/report/pdf', { studentId });
  return res.blob();
}

export function emailReport(studentId: string, email: string): Promise<{ sent: boolean; id: string | null }> {
  return post<{ sent: boolean; id: string | null }>('/api/report/email', { studentId, email });
}
