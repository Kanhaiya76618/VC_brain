import { NextResponse } from 'next/server';
import { buildDossierPdf } from '@/lib/vc/report/buildDossierPdf';

export async function POST(request: Request) {
  try {
    const { opportunityId } = await request.json();
    if (typeof opportunityId !== 'string' || !opportunityId.trim()) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty "opportunityId" string.' },
        { status: 400 }
      );
    }
    const buffer = await buildDossierPdf(opportunityId);
    // Buffer is not a valid BodyInit under strict types
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="vcbrain-dossier.pdf"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
