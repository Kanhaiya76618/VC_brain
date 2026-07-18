import { Resend } from 'resend';
import { callClaudeJSON } from '../../llm';
import { append, find, id, readPayload, where } from '../store';
import { trace } from '../trace';
import type { Artifact, Lead, OutreachDraft } from '../schema';

// The Activator drafts cold outreach for a surfaced pre-raise lead. Its goal
// is to trigger a real APPLICATION into the same screening funnel — never an
// investment, and NEVER an automatic send. The send path physically refuses
// any draft whose latest state was not set by a human approval action.

interface RawDraft {
  subject: string;
  body: string;
}

const SYSTEM = `You draft a short, personalized cold outreach email from an early-stage investor to a founder whose company was surfaced by public build signals.

Rules:
- 90-130 words, plain text, no placeholders like [Name] — address the founder by the name provided.
- MUST cite at least two of the specific artifacts provided, concretely (e.g. the Show HN title, the repository's release cadence, the paper) — that specificity is the whole point.
- The ask is a conversation / an invitation to share materials, explicitly NOT an offer to invest.
- No flattery inflation, no claims about their business you cannot see in the artifacts.
- Sign off as "The VC Brain team".

Respond ONLY with JSON: { "subject": string, "body": string }`;

function latestByDraftId(): Map<string, OutreachDraft> {
  const map = new Map<string, OutreachDraft>();
  for (const row of where<OutreachDraft>('outreach_drafts', () => true)) {
    map.set(row.draft_id, row); // append-only: last row per draft_id is current
  }
  return map;
}

export function draftsForLead(leadId: string): OutreachDraft[] {
  return [...latestByDraftId().values()].filter((d) => d.lead_id === leadId);
}

export function latestDraft(draftId: string): OutreachDraft | undefined {
  return latestByDraftId().get(draftId);
}

export async function draftOutreach(leadId: string): Promise<OutreachDraft> {
  const lead = find<Lead>('leads', (l) => l.lead_id === leadId);
  if (!lead) throw new Error(`Unknown lead: ${leadId}`);
  const company = find<{ company_id: string; canonical_name: string }>(
    'companies',
    (c) => c.company_id === lead.company_id
  );
  const artifacts = where<Artifact>('artifacts', (a) => a.company_id === lead.company_id).slice(0, 5);
  if (artifacts.length === 0) throw new Error('No surfacing artifacts to cite — refusing to draft generic outreach.');

  const artifactLines = artifacts.map((a) => {
    let excerpt = '';
    try {
      excerpt = readPayload(a.payload_path).slice(0, 240);
    } catch {
      /* payload optional for drafting */
    }
    return `- [${a.artifact_id}] ${a.kind} — "${a.title}"${a.url ? ` (${a.url})` : ''}: ${excerpt}`;
  });

  const founderNode = lead.link_graph.nodes.find((n) => n.type === 'builder');
  const raw = await callClaudeJSON<RawDraft>({
    system: SYSTEM,
    user: [
      `COMPANY: ${company?.canonical_name ?? 'the company'}`,
      `FOUNDER: ${founderNode?.label ?? 'founder'}`,
      `WHY THEY SURFACED NOW: ${lead.why_now}`,
      '',
      'ARTIFACTS THAT SURFACED THEM (cite at least two, concretely):',
      ...artifactLines,
    ].join('\n'),
    maxTokens: 600,
  });

  const draft = append<OutreachDraft>('outreach_drafts', {
    draft_id: id('drf'),
    lead_id: leadId,
    subject: raw.subject,
    body: raw.body,
    cited_artifact_ids: artifacts.map((a) => a.artifact_id),
    status: 'draft',
  });
  trace({
    agent: 'activator',
    action: 'drafted_outreach',
    inputs: { artifact_ids: artifacts.map((a) => a.artifact_id), note: `lead ${leadId}` },
    output_refs: [draft.draft_id],
  });
  return draft;
}

export function approveDraft(draftId: string): OutreachDraft {
  const current = latestDraft(draftId);
  if (!current) throw new Error(`Unknown draft: ${draftId}`);
  if (current.status === 'sent') throw new Error('This draft was already sent.');
  const approved = append<OutreachDraft>('outreach_drafts', {
    ...current,
    status: 'approved_by_human',
  });
  trace({
    agent: 'activator',
    action: 'draft_approved_by_human',
    inputs: { note: draftId },
    output_refs: [draftId],
  });
  return approved;
}

// HARD RULE: the only path to Resend. Anything not carrying an explicit human
// approval is refused — there is no auto-send code path in this system.
export async function sendApproved(draftId: string, toEmail: string): Promise<{ id: string | null }> {
  const current = latestDraft(draftId);
  if (!current) throw new Error(`Unknown draft: ${draftId}`);
  if (current.status !== 'approved_by_human') {
    throw new Error(`Refusing to send: draft status is "${current.status}", not "approved_by_human". A human must approve every send.`);
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_ADDRESS || 'VC Brain <onboarding@resend.dev>',
    to: [toEmail],
    subject: current.subject,
    text: current.body,
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);

  append<OutreachDraft>('outreach_drafts', { ...current, status: 'sent' });
  trace({
    agent: 'activator',
    action: 'sent_after_human_approval',
    inputs: { note: `draft ${draftId} → ${toEmail}` },
    output_refs: [draftId],
  });
  return { id: data?.id ?? null };
}
