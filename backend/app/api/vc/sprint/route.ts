import { NextResponse } from 'next/server';
import { runDemoSprint, sprintsForPerson } from '@/lib/vc/agents/capabilitySprint';

export async function GET(request: Request) {
  try {
    const personId = new URL(request.url).searchParams.get('personId');
    if (!personId) return NextResponse.json({ error: 'personId query parameter is required.' }, { status: 400 });
    return NextResponse.json({ sprints: sprintsForPerson(personId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { personId } = await request.json();
    if (typeof personId !== 'string' || !personId.trim()) {
      return NextResponse.json({ error: 'Request body must include a non-empty "personId".' }, { status: 400 });
    }
    return NextResponse.json({ sprint: runDemoSprint(personId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
