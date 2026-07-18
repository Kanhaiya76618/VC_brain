import { NextResponse } from 'next/server';
import { queryEvidenceGraph } from '@/lib/vc/query';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Request body must include a non-empty "query" string.' }, { status: 400 });
    }
    return NextResponse.json(queryEvidenceGraph(query.trim()));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
