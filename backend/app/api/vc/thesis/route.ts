import { NextResponse } from 'next/server';
import { activeThesis, saveThesis, type ThesisInput } from '@/lib/vc/thesis';

export async function GET() {
  return NextResponse.json({ thesis: activeThesis() });
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as ThesisInput;
    if (!input || !Array.isArray(input.sectors) || !Array.isArray(input.stages) || !Array.isArray(input.geographies) || !input.check_size) {
      return NextResponse.json({ error: 'A complete thesis configuration is required.' }, { status: 400 });
    }
    return NextResponse.json({ thesis: saveThesis(input) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
