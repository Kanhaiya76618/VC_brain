import { NextResponse } from 'next/server';
import { pipelineView } from '@/lib/vc/pipeline';

export async function GET() {
  try {
    return NextResponse.json(pipelineView());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
