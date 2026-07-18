import { NextResponse } from 'next/server';
import { buildReportPdf } from '@/lib/report/buildReport';

export async function POST(request: Request) {
  try {
    const { studentId } = await request.json();
    if (typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty "studentId" string.' },
        { status: 400 }
      );
    }
    const { buffer } = await buildReportPdf(studentId);
    // Buffer is not a valid BodyInit under strict types
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="researchos-report.pdf"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
