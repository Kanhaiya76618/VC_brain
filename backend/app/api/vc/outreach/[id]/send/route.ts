import { NextResponse } from 'next/server';
import { sendApproved } from '@/lib/vc/agents/activator';

// Sending requires a prior explicit human approval on the draft; the agent
// refuses anything else. There is no automatic-send path in this system.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { toEmail } = await request.json();
    if (typeof toEmail !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(toEmail)) {
      return NextResponse.json({ error: 'Request body must include a valid "toEmail".' }, { status: 400 });
    }
    return NextResponse.json(await sendApproved(id, toEmail));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
