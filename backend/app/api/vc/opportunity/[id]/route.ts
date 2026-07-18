import { NextResponse } from 'next/server';
import { opportunityView } from '@/lib/vc/pipeline';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const view = opportunityView(id);
    if (!view) return NextResponse.json({ error: `Unknown opportunity: ${id}` }, { status: 404 });
    return NextResponse.json(view);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
