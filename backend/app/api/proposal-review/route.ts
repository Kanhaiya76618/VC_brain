import { NextResponse } from 'next/server';
import { reviewProposal } from '@/lib/agents/panelAgent';
import { recordPanelVerdict } from '@/lib/orchestrator/knowledgeGraph';

export async function POST(request: Request) {
  try {
    const { proposalText, studentId } = await request.json();
    if (typeof proposalText !== 'string' || !proposalText.trim() || typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json(
        { error: 'Request body must include non-empty "proposalText" and "studentId" strings.' },
        { status: 400 }
      );
    }
    const verdict = await reviewProposal(studentId, proposalText);
    recordPanelVerdict(studentId, verdict);
    return NextResponse.json(verdict);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
