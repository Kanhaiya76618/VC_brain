import { Resend } from 'resend';
import { callClaude } from '../llm';
import type { SupervisorReport } from './supervisorAgent';

const SYSTEM =
  "Rewrite an advisor's summary into a short, warm email body to the student. 3-4 sentences max. No greeting, no sign-off, no subject line. Keep every factual claim intact.";

export async function sendProgressReport({
  toEmail,
  studentId,
  supervisor,
  pdfBuffer,
}: {
  toEmail: string;
  studentId: string;
  supervisor: SupervisorReport;
  pdfBuffer: Buffer;
}): Promise<{ id: string | null }> {
  // Construct inside the function: the Resend constructor throws on a missing
  // key, and module scope runs during `next build` page-data collection where
  // env vars are absent — which would fail the whole build.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  const resend = new Resend(apiKey);

  const body = await callClaude({
    system: SYSTEM,
    user: supervisor.overallNarrative,
    maxTokens: 300,
  });

  const html =
    body.replace(/\n/g, '<br/>') +
    '<br/><br/><span style="color:#6e6e73;font-size:12px">Full detail attached as a PDF.</span>';

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_ADDRESS || 'ResearchOS <onboarding@resend.dev>',
    to: [toEmail],
    subject: 'Your ResearchOS progress report',
    html,
    attachments: [{ filename: 'researchos-report.pdf', content: pdfBuffer }],
  });
  if (error) throw new Error(`Resend failed for student ${studentId}: ${error.message}`);
  return { id: data?.id ?? null };
}
