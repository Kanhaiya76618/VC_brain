import { NextResponse } from 'next/server';
import { buildReportPdf } from '@/lib/report/buildReport';
import { sendProgressReport } from '@/lib/agents/notifyAgent';

export async function POST(request: Request) {
  try {
    const { studentId, email } = await request.json();
    if (typeof studentId !== 'string' || !studentId.trim() || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Request body must include non-empty "studentId" and "email" strings.' },
        { status: 400 }
      );
    }
    const { buffer, supervisor } = await buildReportPdf(studentId);
    const { id } = await sendProgressReport({ toEmail: email, studentId, supervisor, pdfBuffer: buffer });
    return NextResponse.json({ sent: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
