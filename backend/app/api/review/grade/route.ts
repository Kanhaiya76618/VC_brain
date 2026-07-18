import { NextResponse } from 'next/server';
import { gradeReview, type ReviewExercise } from '@/lib/agents/reviewerAgent';
import { recordReviewGrade } from '@/lib/orchestrator/knowledgeGraph';

export async function POST(request: Request) {
  try {
    const { exercise, studentReview, studentId } = await request.json();
    const exerciseValid =
      exercise != null &&
      typeof exercise.excerpt === 'string' &&
      exercise.excerpt.trim().length > 0 &&
      Array.isArray(exercise.plantedFlaws);
    if (
      !exerciseValid ||
      typeof studentReview !== 'string' || !studentReview.trim() ||
      typeof studentId !== 'string' || !studentId.trim()
    ) {
      return NextResponse.json(
        { error: 'Request body must include an "exercise" ({ excerpt, plantedFlaws }), plus non-empty "studentReview" and "studentId" strings.' },
        { status: 400 }
      );
    }
    const grade = await gradeReview(exercise as ReviewExercise, studentReview);
    recordReviewGrade(studentId, grade);
    return NextResponse.json(grade);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
