import { NextResponse } from 'next/server';
import { logExperiment } from '@/lib/agents/archivistAgent';
import { recordArchiveEntry } from '@/lib/orchestrator/knowledgeGraph';

export async function POST(request: Request) {
  try {
    const { attempted, outcome, hypothesis, studentId } = await request.json();
    const valid = [attempted, outcome, hypothesis, studentId].every(
      (v) => typeof v === 'string' && v.trim().length > 0
    );
    if (!valid) {
      return NextResponse.json(
        { error: 'Request body must include non-empty "attempted", "outcome", "hypothesis", and "studentId" strings.' },
        { status: 400 }
      );
    }
    const entry = await logExperiment(studentId, { attempted, outcome, hypothesis });
    recordArchiveEntry(studentId, entry);
    return NextResponse.json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
