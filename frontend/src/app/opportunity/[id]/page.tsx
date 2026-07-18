'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Clock,
  Download,
  FileText,
  FlaskConical,
  Hand,
  HelpCircle,
  Inbox,
  Minus,
  Radar,
  Scale,
  ShieldCheck,
  Sigma,
  Sparkles,
  User,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import {
  downloadMemoPdf,
  fmtDuration,
  getOpportunity,
  getTrace,
  type AxisScore,
  type Claim,
  type Contradiction,
  type OpportunityView,
  type TraceEvent,
} from '@/lib/vcApi';

const BAND_STYLES: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size?: number }> }> = {
  verified: { label: 'Verified', color: '#0d9488', bg: 'rgba(13,148,136,0.1)', icon: ShieldCheck },
  corroborated: { label: 'Corroborated', color: '#4f46e5', bg: 'rgba(79,70,229,0.1)', icon: ShieldCheck },
  founder_stated: { label: 'Founder-stated', color: '#d97706', bg: 'rgba(217,119,6,0.1)', icon: CircleDashed },
  weak_or_disputed: { label: 'Weak / disputed', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', icon: AlertTriangle },
};

const AXIS_META: Record<string, { label: string; color: string }> = {
  founder: { label: 'Founder', color: '#7c3aed' },
  market: { label: 'Market', color: '#0d9488' },
  idea_market: { label: 'Idea vs Market', color: '#d97706' },
};

const TREND_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  improving: { label: 'improving', icon: ArrowRight },
  declining: { label: 'declining', icon: ArrowRight },
  stable: { label: 'stable', icon: Minus },
  insufficient_history: { label: 'insufficient history', icon: HelpCircle },
};

function TrustChip({ claim }: { claim: Claim }) {
  const band = claim.assessment?.band ?? 'founder_stated';
  const s = BAND_STYLES[band];
  const IconCmp = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}25` }}
      title={`${claim.source.locator}: "${claim.source.verbatim_quote}"`}
    >
      <IconCmp size={9} />
      {claim.assessment ? `${claim.assessment.trust}` : '·'} {s.label}
    </span>
  );
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-sm font-bold text-foreground tracking-tight mb-3 mt-10 scroll-mt-20">
      {children}
    </h2>
  );
}

function AxisCard({ axis }: { axis: AxisScore }) {
  const [open, setOpen] = useState(false);
  const meta = AXIS_META[axis.axis];
  const trend = TREND_META[axis.trend];
  const TrendIcon = trend.icon;
  const hasScore = axis.score !== null;
  return (
    <div className="glass rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold" style={{ color: meta.color }}>
          {meta.label}
        </p>
        <span
          className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground"
          style={axis.trend === 'declining' ? { transform: 'none' } : undefined}
        >
          <TrendIcon size={10} />
          {trend.label}
          {axis.market_label && (
            <span
              className="ml-1 px-1.5 py-0.5 rounded font-semibold uppercase"
              style={{
                color: axis.market_label === 'bull' ? '#0d9488' : axis.market_label === 'bear' ? '#dc2626' : '#d97706',
                background:
                  axis.market_label === 'bull'
                    ? 'rgba(13,148,136,0.1)'
                    : axis.market_label === 'bear'
                      ? 'rgba(220,38,38,0.1)'
                      : 'rgba(217,119,6,0.1)',
              }}
            >
              {axis.market_label}
            </span>
          )}
        </span>
      </div>

      {hasScore ? (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-foreground">{axis.score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            coverage {axis.coverage.toFixed(2)} · band {axis.band[0]}–{axis.band[1]}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5 mt-1">
            <HelpCircle size={16} style={{ color: '#6e6e73' }} />
            <span className="text-sm font-semibold text-muted-foreground">Not enough evidence</span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            coverage {axis.coverage.toFixed(2)} — below 0.50, no number is shown
          </p>
        </>
      )}

      {/* Score bar with uncertainty band */}
      <div className="relative h-2 rounded-full mt-3 overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${axis.band[0]}%`,
            width: `${Math.max(axis.band[1] - axis.band[0], 2)}%`,
            background: `${meta.color}30`,
          }}
        />
        {hasScore && (
          <motion.div
            className="absolute inset-y-0 w-1 rounded-full"
            initial={{ left: 0 }}
            animate={{ left: `${axis.score}%` }}
            style={{ background: meta.color }}
          />
        )}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground mt-3 transition-colors"
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        subscores & evidence
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {axis.subscores.map((s) => (
            <div key={s.name} className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(0,0,0,0.03)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-foreground">{s.name.replace(/_/g, ' ')}</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {s.value === null ? 'no evidence' : s.value} · w {Math.round(s.weight * 100)}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.rationale}</p>
              {s.evidence_claim_ids.length > 0 && (
                <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
                  evidence: {s.evidence_claim_ids.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContradictionCard({ c, claims }: { c: Contradiction; claims: Claim[] }) {
  const pair = c.claim_ids.map((cid) => claims.find((cl) => cl.claim_id === cid)).filter(Boolean) as Claim[];
  const sevColor = c.severity === 'hard' ? '#dc2626' : c.severity === 'material' ? '#d97706' : '#6e6e73';
  return (
    <div className="critique-contradiction rounded-xl p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <AlertTriangle size={13} style={{ color: '#dc2626' }} />
        <span className="text-[10px] font-mono font-bold uppercase" style={{ color: sevColor }}>
          {c.severity}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          rule: {c.rule} · domain: {c.domain} · {c.rule_version} · preserved, never reconciled
        </span>
      </div>
      <p className="text-xs text-foreground mt-2">{c.detail}</p>
      <div className="grid md:grid-cols-2 gap-2 mt-3">
        {pair.map((cl) => (
          <div key={cl.claim_id} className="rounded-lg bg-white/60 px-3 py-2 border border-black/5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-mono text-muted-foreground">{cl.source.locator}</span>
              <TrustChip claim={cl} />
            </div>
            <p className="text-[11px] text-foreground mt-1 italic">&ldquo;{cl.source.verbatim_quote}&rdquo;</p>
            {cl.derivation && (
              <p className="text-[10px] font-mono mt-1" style={{ color: '#4f46e5' }}>
                <Sigma size={9} className="inline mr-1" />
                {cl.derivation.calculation}
              </p>
            )}
          </div>
        ))}
      </div>
      {c.llm_reconciliation_note && (
        <p className="text-[10px] text-muted-foreground mt-2">
          <Sparkles size={9} className="inline mr-1" />
          Possible reconciliation (flag retained): {c.llm_reconciliation_note}
        </p>
      )}
    </div>
  );
}

function ClaimRow({ claim }: { claim: Claim }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-subtle rounded-xl px-4 py-3">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-2 flex-wrap">
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          <span className="text-[11px] font-mono font-semibold text-foreground">{claim.predicate}</span>
          <span className="text-xs text-foreground">
            {typeof claim.value_json === 'number' ? claim.value_json.toLocaleString('en-US') : String(claim.value_json).slice(0, 60)}
            {claim.unit ? ` ${claim.unit}` : ''}
          </span>
          {claim.basis && (
            <span
              className="text-[9px] font-mono px-1 py-0.5 rounded uppercase"
              style={{
                color: claim.basis === 'projected' ? '#d97706' : '#6e6e73',
                background: claim.basis === 'projected' ? 'rgba(217,119,6,0.1)' : 'rgba(0,0,0,0.05)',
              }}
            >
              {claim.basis}
            </span>
          )}
          {claim.derivation && (
            <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ color: '#4f46e5', background: 'rgba(79,70,229,0.08)' }}>
              DERIVED
            </span>
          )}
          {claim.artifact?.synthetic && (
            <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.08)' }}>
              SYNTHETIC
            </span>
          )}
          <span className="ml-auto">
            <TrustChip claim={claim} />
          </span>
        </div>
      </button>
      {open && (
        <div className="mt-3 pl-5 space-y-2">
          <p className="text-[11px] text-foreground italic">&ldquo;{claim.source.verbatim_quote}&rdquo;</p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {claim.artifact?.title ?? claim.source.artifact_id} · {claim.source.locator}
          </p>
          {claim.derivation && (
            <p className="text-[10px] font-mono" style={{ color: '#4f46e5' }}>
              <Sigma size={9} className="inline mr-1" />
              {claim.derivation.calculation}
            </p>
          )}
          {/* Four distinct timestamps — a 2023 event fetched today is not new momentum */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-muted-foreground">
            <span>event: {claim.valid_at ?? '—'}</span>
            <span>published: {claim.published_at?.slice(0, 10) ?? '—'}</span>
            <span>fetched: {claim.fetched_at.slice(0, 10)}</span>
            <span>
              validated: {claim.validations.length ? claim.validations[claim.validations.length - 1].validated_at.slice(0, 10) : '—'}
            </span>
          </div>
          {claim.assessment && (
            <p className="text-[9px] font-mono text-muted-foreground">
              trust {claim.assessment.trust} = 30×{claim.assessment.provenance} prov + 25×{claim.assessment.directness} direct + 20×
              {claim.assessment.reliability} reliab + 15×{claim.assessment.recency} recency + 10×{claim.assessment.agreement} agree −{' '}
              {claim.assessment.conflict_penalty} conflict · {claim.assessment.rule_version}
            </p>
          )}
          {claim.validations.map((v) => (
            <div key={v.validation_id} className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.03)' }}>
              <p className="text-[10px] font-semibold text-foreground">
                Validator: {v.verdict.replace(/_/g, ' ')} <span className="font-mono text-muted-foreground">({v.method})</span>
              </p>
              {v.shown_calculation && <p className="text-[10px] text-muted-foreground mt-0.5">{v.shown_calculation}</p>}
              {v.evidence.map((e, i) => (
                <p key={i} className="text-[10px] text-muted-foreground italic mt-0.5">
                  ↳ &ldquo;{e.snippet}&rdquo;
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceChip({ claimIds, claims }: { claimIds: string[]; claims: Claim[] }) {
  const [open, setOpen] = useState(false);
  if (claimIds.length === 0) return null;
  const linked = claimIds.map((cid) => claims.find((c) => c.claim_id === cid)).filter(Boolean) as Claim[];
  return (
    <span className="inline">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-0.5 align-middle ml-1 px-1 py-0.5 rounded text-[9px] font-mono font-semibold transition-colors"
        style={{ color: '#4f46e5', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.15)' }}
        aria-label={`Show ${linked.length} evidence source(s)`}
      >
        <FileText size={8} /> {linked.length}
      </button>
      {open && (
        <span className="block mt-1.5 mb-2 space-y-1">
          {linked.map((c) => (
            <span key={c.claim_id} className="flex items-start gap-2 rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(79,70,229,0.05)' }}>
              <TrustChip claim={c} />
              <span className="text-[10px] text-muted-foreground">
                {c.source.locator}: <em>&ldquo;{c.source.verbatim_quote}&rdquo;</em>
              </span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

export default function OpportunityPage() {
  const params = useParams<{ id: string }>();
  const [view, setView] = useState<OpportunityView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[] | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);

  const refresh = useCallback(() => {
    if (!params?.id) return;
    getOpportunity(params.id).then(setView).catch((e) => setError(e.message));
  }, [params?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const bandCounts = useMemo(() => {
    const counts = { verified: 0, corroborated: 0, founder_stated: 0, weak_or_disputed: 0 };
    for (const c of view?.claims ?? []) {
      const b = c.assessment?.band;
      if (b) counts[b] += 1;
    }
    return counts;
  }, [view]);

  const openTrace = async () => {
    setTraceOpen((v) => !v);
    if (!traceEvents && params?.id) {
      const t = await getTrace(params.id);
      setTraceEvents(t.events);
    }
  };

  const handlePdf = async () => {
    if (!params?.id) return;
    const blob = await downloadMemoPdf(params.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vcbrain-memo.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <AppShell topic="Opportunity">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="critique-contradiction rounded-xl px-4 py-3">
            <p className="text-xs" style={{ color: '#dc2626' }}>
              {error}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!view) {
    return (
      <AppShell topic="Opportunity" agentStatus="running">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground animate-thinking">Loading evidence graph…</p>
        </div>
      </AppShell>
    );
  }

  const firstSignal = view.transitions.find((t) => t.to === 'first_signal');
  const lastTransition = view.transitions[view.transitions.length - 1];
  const elapsed =
    firstSignal && lastTransition
      ? new Date(lastTransition.at).getTime() - new Date(firstSignal.at).getTime()
      : null;
  const synthetic = view.claims.some((c) => c.artifact?.synthetic);
  const routing = view.routing;
  const missingCount = view.memo?.missing.length ?? 0;

  return (
    <AppShell topic={view.company?.canonical_name ?? 'Opportunity'} agentStatus="idle">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {view.company?.canonical_name ?? 'Unknown company'}
          </h1>
          {view.company?.primary_domain && (
            <span className="text-xs font-mono text-muted-foreground">{view.company.primary_domain}</span>
          )}
          <span
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md"
            style={{
              color: view.opportunity.entry_point === 'outbound' ? '#7c3aed' : '#0d9488',
              background: view.opportunity.entry_point === 'outbound' ? 'rgba(124,58,237,0.1)' : 'rgba(13,148,136,0.1)',
            }}
          >
            {view.opportunity.entry_point === 'outbound' ? <Radar size={10} /> : <Inbox size={10} />}
            {view.opportunity.entry_point}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md" style={{ color: '#4f46e5', background: 'rgba(79,70,229,0.1)' }}>
            stage: {view.stage}
          </span>
          {synthetic && (
            <span
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md"
              style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.1)' }}
            >
              <FlaskConical size={10} /> SYNTHETIC DATA
            </span>
          )}
          {elapsed !== null && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground ml-auto">
              <Clock size={10} /> first signal → {lastTransition.to}: {fmtDuration(elapsed)}
            </span>
          )}
        </div>

        {/* Routing banner */}
        {routing && (
          <div
            className="rounded-xl px-4 py-3 mb-6 flex items-start gap-3"
            style={{
              background: routing.route === 'hold' ? 'rgba(220,38,38,0.07)' : 'rgba(13,148,136,0.07)',
              border: `1px solid ${routing.route === 'hold' ? 'rgba(220,38,38,0.25)' : 'rgba(13,148,136,0.25)'}`,
            }}
          >
            {routing.route === 'hold' ? (
              <Hand size={16} style={{ color: '#dc2626' }} className="mt-0.5 shrink-0" />
            ) : (
              <Scale size={16} style={{ color: '#0d9488' }} className="mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold" style={{ color: routing.route === 'hold' ? '#dc2626' : '#0d9488' }}>
                {routing.route === 'hold' ? 'HOLD for human review' : `Recommended route: ${routing.route.replace(/_/g, ' ')}`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{routing.matrix_rule}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                The system recommends and shows its work — a human makes the decision.
              </p>
            </div>
          </div>
        )}

        {/* Trust strip */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BAND_STYLES) as (keyof typeof BAND_STYLES)[]).map((band) => {
            const s = BAND_STYLES[band];
            const IconCmp = s.icon;
            return (
              <span
                key={band}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}20` }}
              >
                <IconCmp size={11} />
                {bandCounts[band as keyof typeof bandCounts]} {s.label}
              </span>
            );
          })}
          <span
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{ color: '#dc2626', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}
          >
            <AlertTriangle size={11} />
            {view.contradictions.length} contradicted
          </span>
          <span
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{ color: '#6e6e73', background: 'rgba(110,110,115,0.08)', border: '1px solid rgba(110,110,115,0.2)' }}
          >
            <CircleDashed size={11} />
            {missingCount} missing
          </span>
        </div>

        {/* Three independent axes — never averaged, no aggregate exists */}
        <SectionTitle id="axes">Screening axes — three independent scores, never averaged</SectionTitle>
        <div className="grid md:grid-cols-3 gap-4">
          {view.axes.map((a) => (
            <AxisCard key={a.axis} axis={a} />
          ))}
          {view.axes.length === 0 && (
            <p className="text-xs text-muted-foreground col-span-3">Run diligence to score the three axes.</p>
          )}
        </div>

        {/* Contradictions */}
        <SectionTitle id="contradictions">Contradictions — preserved, never smoothed away</SectionTitle>
        <div className="space-y-3">
          {view.contradictions.map((c) => (
            <ContradictionCard key={c.contradiction_id} c={c} claims={view.claims} />
          ))}
          {view.contradictions.length === 0 && <p className="text-xs text-muted-foreground">None detected yet.</p>}
        </div>

        {/* Founders */}
        <SectionTitle id="founders">Founder scores — persistent, follow the person, never reset</SectionTitle>
        <div className="grid md:grid-cols-2 gap-4">
          {view.persons.map((p) => {
            const fs = p.founder_score;
            return (
              <div key={p.person_id} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(124,58,237,0.12)' }}
                  >
                    <User size={14} style={{ color: '#7c3aed' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.canonical_name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{p.person_id}</p>
                  </div>
                </div>
                {fs.total !== null ? (
                  <p className="text-lg font-bold text-foreground">
                    {fs.total} / 100{' '}
                    <span className="text-[10px] font-mono font-normal text-muted-foreground">
                      coverage {fs.coverage.toFixed(2)} · band {fs.band[0]}–{fs.band[1]}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                    <HelpCircle size={13} /> Not enough evidence
                    <span className="text-[10px] font-mono font-normal">
                      (coverage {fs.coverage.toFixed(2)} — neutral prior 50, never adverse)
                    </span>
                  </p>
                )}
                <div className="mt-3 space-y-1">
                  {Object.entries(fs.components)
                    .filter(([, c]) => c.evidence_count > 0)
                    .map(([name, c]) => (
                      <div key={name} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{name.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-foreground">
                          {c.value} · w{c.weight} · {c.evidence_count} evidence
                        </span>
                      </div>
                    ))}
                  {Object.values(fs.components).every((c) => c.evidence_count === 0) && (
                    <p className="text-[10px] text-muted-foreground">
                      Cold start: all components at neutral 50 with no evidence events yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Evidence */}
        <SectionTitle id="evidence">Evidence — every claim, its trust math, and its four timestamps</SectionTitle>
        <div className="space-y-2">
          {view.claims.map((c) => (
            <ClaimRow key={c.claim_id} claim={c} />
          ))}
        </div>

        {/* Memo */}
        {view.memo && (
          <>
            <div className="flex items-center justify-between mt-10 mb-3">
              <h2 id="memo" className="text-sm font-bold text-foreground tracking-tight scroll-mt-20">
                Investment memo — every fact carries an evidence chip
              </h2>
              <button
                onClick={handlePdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                <Download size={12} /> Export PDF
              </button>
            </div>
            <div className="glass rounded-2xl p-6">
              {view.memo.sections.map((s) => (
                <div key={s.title} className="mb-5 last:mb-0">
                  <p className="eyebrow mb-1.5">{s.title}</p>
                  {s.sentences.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No evidence-backed content.</p>
                  ) : (
                    <div className="text-[13px] leading-relaxed text-foreground">
                      {s.sentences.map((sent, i) => (
                        <span key={i}>
                          {sent.text}
                          <EvidenceChip claimIds={sent.claim_ids} claims={view.claims} />{' '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t border-black/5 pt-4 mt-4">
                <p className="eyebrow mb-1.5">Hypotheses & falsifiers</p>
                {view.memo.hypotheses.map((h, i) => (
                  <div key={i} className="mb-2">
                    <p className="text-[13px] text-foreground">
                      {i + 1}. {h.statement}
                      <EvidenceChip claimIds={h.claim_ids} claims={view.claims} />
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#d97706' }}>
                      Falsifier: {h.falsifier}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-black/5 pt-4 mt-4">
                <p className="eyebrow mb-1.5">Flagged as missing — never fabricated</p>
                <div className="flex flex-wrap gap-1.5">
                  {view.memo.missing.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] font-medium px-2 py-1 rounded-md"
                      style={{ color: '#6e6e73', background: 'rgba(110,110,115,0.08)', border: '1px dashed rgba(110,110,115,0.3)' }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Trace inspector */}
        <SectionTitle id="trace">Agentic trace — actions and evidence, reproducible</SectionTitle>
        <button
          onClick={openTrace}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-subtle text-xs font-medium text-foreground hover:bg-white/80 transition-colors"
        >
          {traceOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {traceOpen ? 'Hide' : 'Show'} full trace
        </button>
        {traceOpen && traceEvents && (
          <div className="mt-3 space-y-1">
            {traceEvents.map((t) => (
              <div key={t.trace_id} className="flex items-start gap-2 text-[10px] font-mono glass-subtle rounded-lg px-3 py-1.5">
                <span className="text-muted-foreground shrink-0">{t.at.slice(11, 19)}</span>
                <span className="font-semibold shrink-0" style={{ color: '#4f46e5' }}>
                  {t.agent}
                </span>
                <span className="text-foreground">{t.action}</span>
                {t.inputs.note && <span className="text-muted-foreground truncate">— {t.inputs.note}</span>}
                <span className="text-muted-foreground ml-auto shrink-0">
                  {t.output_refs.length} refs · {t.rule_version}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Stage timeline */}
        <SectionTitle>Stage timeline</SectionTitle>
        <div className="flex flex-wrap items-center gap-2 pb-10">
          {view.transitions.map((t, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ArrowRight size={11} className="text-muted-foreground" />}
              <span className="glass-subtle rounded-lg px-2.5 py-1.5 text-[10px] font-mono">
                <span className="font-semibold text-foreground">{t.to}</span>{' '}
                <span className="text-muted-foreground">
                  {t.at.slice(5, 16).replace('T', ' ')} · {t.actor}
                </span>
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
