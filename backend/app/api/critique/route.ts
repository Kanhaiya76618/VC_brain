import { NextResponse } from 'next/server';
import { critiqueDraft } from '@/lib/agents/criticAgent';
import { recordCritique } from '@/lib/orchestrator/knowledgeGraph';

export async function POST(request: Request) {
  try {
    const { draftText, studentId } = await request.json();
    if (typeof draftText !== 'string' || !draftText.trim() || typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json(
        { error: 'Request body must include non-empty "draftText" and "studentId" strings.' },
        { status: 400 }
      );
    }
    const result = await critiqueDraft(draftText, studentId);
    recordCritique(studentId, result);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
