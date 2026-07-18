import { NextResponse } from 'next/server';
import { opportunityView, runDiligence } from '@/lib/vc/pipeline';

export async function POST(request: Request) {
  try {
    const { opportunityId } = await request.json();
    if (typeof opportunityId !== 'string' || !opportunityId.trim()) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty "opportunityId" string.' },
        { status: 400 }
      );
    }
    await runDiligence(opportunityId);
    return NextResponse.json(opportunityView(opportunityId));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
