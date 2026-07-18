import { NextResponse } from 'next/server';
import { buildLearningPath } from '@/lib/agents/curriculumAgent';
import { recordLearningPath } from '@/lib/orchestrator/knowledgeGraph';

export async function POST(request: Request) {
  try {
    const { arxivUrl, studentId } = await request.json();
    if (typeof arxivUrl !== 'string' || !arxivUrl.trim() || typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json(
        { error: 'Request body must include non-empty "arxivUrl" and "studentId" strings.' },
        { status: 400 }
      );
    }
    const result = await buildLearningPath(arxivUrl);
    recordLearningPath(studentId, result);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
