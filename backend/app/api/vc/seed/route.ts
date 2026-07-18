import { NextResponse } from 'next/server';
import { seedDriftlock } from '@/lib/vc/pipeline';

// Demo bootstrap: wipes the graph and seeds the synthetic Driftlock company
// (clearly labeled synthetic in every artifact), then extracts its claims.
export async function POST() {
  try {
    const result = await seedDriftlock();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
