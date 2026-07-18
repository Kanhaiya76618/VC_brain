'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, CheckCircle2, ChevronRight, FlaskConical, GitFork, Globe2, Mail, PenLine, Radar, Send, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import AppShell from '@/components/AppShell';
import {
  approveOutreach,
  draftOutreach,
  getOutreachDrafts,
  getScout,
  promoteLead,
  runScout,
  sendOutreach,
  type OutreachDraft,
  type ScoutLead,
  type ScoutRun,
  type ScoutView,
} from '@/lib/vcApi';

const CONDITION_LABELS: Record<string, string> = {
  a_linked_builders: '2+ linked builders',
  b_cross_source: 'Cross-source corroboration',
  c_velocity: 'Accelerating 14-day velocity',
  d_thesis_fit: 'Active-thesis fit',
  e_no_prior_funding: 'No confirmed institutional funding',
};

function Condition({ label, passed, note, refs }: { label: string; passed: boolean; note: string; refs: string[] }) {
  const IconCmp = passed ? CheckCircle2 : XCircle;
  return (
    <div className="rounded-lg px-2.5 py-2" style={{ background: passed ? 'rgba(13,148,136,0.06)' : 'rgba(220,38,38,0.06)' }}>
      <div className="flex items-start gap-1.5">
        <IconCmp size={13} style={{ color: passed ? '#0d9488' : '#dc2626' }} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{note}</p>
          <p className="text-[9px] font-mono text-muted-foreground mt-1">{refs.length} evidence reference{refs.length === 1 ? '' : 's'}</p>
        </div>
      </div>
    </div>
  );
}

const DRAFT_STATUS: Record<OutreachDraft['status'], { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft — awaiting human review', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  approved_by_human: { label: 'Approved by human', color: '#4f46e5', bg: 'rgba(79,70,229,0.1)' },
  sent: { label: 'Sent (after human approval)', color: '#0d9488', bg: 'rgba(13,148,136,0.1)' },
};

function OutreachPanel({ leadId }: { leadId: string }) {
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const refresh = useCallback(() => {
    getOutreachDrafts(leadId).then((r) => setDrafts(r.drafts)).catch(() => setDrafts([]));
  }, [leadId]);

  useEffect(() => { refresh(); }, [refresh]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally { setBusy(false); }
  };

  return (
    <div className="glass-subtle rounded-xl p-3 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">Activator · outreach</p>
        <p className="text-[9px] font-mono text-muted-foreground">drafts only — nothing sends without explicit human approval</p>
      </div>
      {error && <p className="text-[10px] mt-2" style={{ color: '#dc2626' }}>{error}</p>}
      {drafts.length === 0 ? (
        <button
          onClick={() => act(() => draftOutreach(leadId))}
          disabled={busy}
          className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50"
          style={{ color: '#4f46e5', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.15)' }}
        >
          <PenLine size={11} /> {busy ? 'Drafting from surfacing artifacts…' : 'Draft outreach citing surfacing artifacts'}
        </button>
      ) : (
        drafts.map((d) => (
          <div key={d.draft_id} className="rounded-lg bg-white/60 border border-black/5 px-3 py-2.5 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-foreground">{d.subject}</p>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: DRAFT_STATUS[d.status].color, background: DRAFT_STATUS[d.status].bg }}>
                {DRAFT_STATUS[d.status].label}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground whitespace-pre-wrap mt-1.5">{d.body}</p>
            <p className="text-[9px] font-mono text-muted-foreground mt-1.5">cites {d.cited_artifact_ids.length} surfacing artifact(s)</p>
            {d.status === 'draft' && (
              <button
                onClick={() => act(() => approveOutreach(d.draft_id))}
                disabled={busy}
                className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                <UserCheck size={11} /> Approve as human reviewer
              </button>
            )}
            {d.status === 'approved_by_human' && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="recipient@example.com"
                  aria-label="Recipient email"
                  className="px-2.5 py-1.5 rounded-lg text-[11px] bg-white/80 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/40"
                />
                <button
                  onClick={() => act(() => sendOutreach(d.draft_id, email))}
                  disabled={busy || !email}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
                >
                  <Mail size={11} /> Send via Resend
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function LeadCard({ lead, onPromote, busy }: { lead: ScoutLead; onPromote: (id: string) => void; busy: boolean }) {
  const founder = lead.founder_memory;
  return (
    <article className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">{lead.company?.canonical_name ?? 'Unresolved company'}</h2>
            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold" style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.1)' }}>
              <Radar size={9} /> REACH-OUT CANDIDATE
            </span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">{lead.company?.primary_domain ?? 'Domain not disclosed'} · surfaced {new Date(lead.surfaced_at).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{lead.total_score}</p>
          <p className="text-[9px] font-mono text-muted-foreground">formation signal / 100</p>
        </div>
      </div>

      <div className="rounded-xl px-3 py-2.5 mt-4" style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.12)' }}>
        <p className="text-[10px] font-mono font-semibold" style={{ color: '#4f46e5' }}>WHY NOW</p>
        <p className="text-xs text-foreground mt-1">{lead.why_now}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mt-4">
        {Object.entries(lead.conditions).map(([key, condition]) => (
          <Condition key={key} label={CONDITION_LABELS[key] ?? key} passed={condition.passed} note={condition.note} refs={condition.evidence_refs} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        <div className="glass-subtle rounded-xl p-3">
          <p className="eyebrow mb-1.5">Active thesis fit · {lead.score.thesis_fit}/20</p>
          <p className="text-[11px] text-foreground">{lead.thesis_fit.matched.join(' · ') || 'No profile field matched.'}</p>
          {lead.thesis_fit.unmatched.length > 0 && <p className="text-[10px] text-muted-foreground mt-1">Unmatched: {lead.thesis_fit.unmatched.join(' · ')}</p>}
        </div>
        <div className="glass-subtle rounded-xl p-3">
          <p className="eyebrow mb-1.5">Founder memory</p>
          {founder ? (
            <p className="text-[11px] text-foreground">
              {founder.total === null ? 'Neutral prior 50 — not enough evidence' : `${founder.total} / 100`} <span className="font-mono text-muted-foreground">coverage {founder.coverage.toFixed(2)} · band {founder.band[0]}–{founder.band[1]}</span>
            </p>
          ) : <p className="text-[11px] text-muted-foreground">No person with a stable identity is linked.</p>}
        </div>
      </div>

      <OutreachPanel leadId={lead.lead_id} />

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground"><GitFork size={11} /> {lead.link_graph.nodes.length} graph nodes · {lead.link_graph.edges.length} evidence edges</p>
        <button
          onClick={() => onPromote(lead.lead_id)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          <Send size={12} /> Open for screening <ChevronRight size={12} />
        </button>
      </div>
    </article>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const [view, setView] = useState<ScoutView | null>(null);
  const [run, setRun] = useState<ScoutRun | null>(null);
  const [busy, setBusy] = useState<'demo' | 'live' | 'promote' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getScout().then(setView).catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const scan = async (mode: 'demo' | 'live') => {
    setBusy(mode);
    setError(null);
    try {
      const result = await runScout(mode);
      setRun(result.run);
      setView(result.view);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally { setBusy(null); }
  };

  const promote = async (leadId: string) => {
    setBusy('promote');
    setError(null);
    try {
      await promoteLead(leadId);
      router.push('/pipeline');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally { setBusy(null); }
  };

  return (
    <AppShell topic="Scout formation detector" agentStatus={busy ? 'running' : 'idle'}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="eyebrow mb-1">Scout · GitHub + Hacker News + arXiv</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Formation detector</h1>
            <p className="text-xs text-muted-foreground mt-1">Only corroborated, pre-raise signals become reach-out candidates. Nothing is automatically invested in or contacted.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => scan('demo')} disabled={busy !== null} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <FlaskConical size={12} /> Seed synthetic Scout demo
            </button>
            <button onClick={() => scan('live')} disabled={busy !== null} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-subtle text-xs font-semibold text-foreground disabled:opacity-50">
              <Globe2 size={12} /> Run bounded live scan
            </button>
          </div>
        </div>

        {run && <div className="glass rounded-xl px-4 py-3 mb-5 flex flex-wrap gap-x-5 gap-y-1 text-xs"><span><Activity size={12} className="inline mr-1" />{run.artifacts} artifacts · {run.signals} signals · {run.leads} qualifying leads</span><span className="font-mono text-muted-foreground">GitHub {run.source_status.github} · HN {run.source_status.hn} · arXiv {run.source_status.arxiv}</span>{run.errors.length > 0 && <span style={{ color: '#d97706' }}>{run.errors.join(' | ')}</span>}</div>}
        {error && <div className="critique-contradiction rounded-xl px-4 py-3 mb-5 text-xs" style={{ color: '#dc2626' }}>{error}</div>}

        <div className="glass-subtle rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={14} style={{ color: '#0d9488' }} /> Active thesis: <span className="font-semibold text-foreground">{view?.thesis.name ?? 'Loading…'}</span>. Changing it re-ranks these leads without rewriting their evidence.</div>
        <div className="space-y-4">
          {(view?.leads ?? []).map((lead) => <LeadCard key={lead.lead_id} lead={lead} onPromote={promote} busy={busy !== null} />)}
          {view && view.leads.length === 0 && <div className="glass rounded-2xl p-8 text-center"><p className="text-sm font-semibold text-foreground">No qualified formation signals yet</p><p className="text-xs text-muted-foreground mt-1">Seed the clearly labelled synthetic demo or run a bounded live scan. The detector requires every condition to pass.</p></div>}
        </div>
      </div>
    </AppShell>
  );
}
