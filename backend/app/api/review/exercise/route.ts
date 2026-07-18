import { NextResponse } from 'next/server';
import { generateExercise } from '@/lib/agents/reviewerAgent';

export async function POST(request: Request) {
  try {
    const { studentId, topicHint } = await request.json();
    if (typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty "studentId" string.' },
        { status: 400 }
      );
    }
    // Exercises are ephemeral until graded — nothing recorded here.
    const exercise = await generateExercise(studentId, typeof topicHint === 'string' ? topicHint : undefined);
    return NextResponse.json(exercise);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
