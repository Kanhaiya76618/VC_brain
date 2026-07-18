import { NextResponse } from 'next/server';
import { runLiveScout, scoutView, seedScoutDemo } from '@/lib/vc/scout';

export async function GET() {
  try {
    return NextResponse.json(scoutView());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.mode === 'demo') return NextResponse.json({ run: seedScoutDemo(), view: scoutView() });
    const limit = typeof body.limit === 'number' ? Math.max(1, Math.min(5, Math.floor(body.limit))) : 3;
    return NextResponse.json({ run: await runLiveScout(limit), view: scoutView() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
