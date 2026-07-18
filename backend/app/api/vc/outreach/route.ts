import { NextResponse } from 'next/server';
import { draftOutreach, draftsForLead } from '@/lib/vc/agents/activator';

export async function GET(request: Request) {
  try {
    const leadId = new URL(request.url).searchParams.get('leadId');
    if (!leadId) return NextResponse.json({ error: 'leadId query parameter is required.' }, { status: 400 });
    return NextResponse.json({ drafts: draftsForLead(leadId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json();
    if (typeof leadId !== 'string' || !leadId.trim()) {
      return NextResponse.json({ error: 'Request body must include a non-empty "leadId" string.' }, { status: 400 });
    }
    return NextResponse.json({ draft: await draftOutreach(leadId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
