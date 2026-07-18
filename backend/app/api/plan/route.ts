import { NextResponse } from 'next/server';
import { planExperiment } from '@/lib/agents/plannerAgent';
import { recordPlan } from '@/lib/orchestrator/knowledgeGraph';

export async function POST(request: Request) {
  try {
    const { objective, plannedApproach, constraints, studentId } = await request.json();
    const valid = [objective, plannedApproach, studentId].every(
      (v) => typeof v === 'string' && v.trim().length > 0
    );
    if (!valid) {
      return NextResponse.json(
        { error: 'Request body must include non-empty "objective", "plannedApproach", and "studentId" strings.' },
        { status: 400 }
      );
    }
    const plan = await planExperiment(studentId, {
      objective,
      plannedApproach,
      constraints: typeof constraints === 'string' ? constraints : undefined,
    });
    recordPlan(studentId, plan);
    return NextResponse.json(plan);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
