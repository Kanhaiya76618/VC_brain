import { NextResponse } from 'next/server';
import { synthesize } from '@/lib/agents/supervisorAgent';

export async function POST(request: Request) {
  try {
    const { studentId } = await request.json();
    if (typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty "studentId" string.' },
        { status: 400 }
      );
    }
    // The Supervisor reads the knowledge graph; it never writes to it.
    const report = await synthesize(studentId);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
