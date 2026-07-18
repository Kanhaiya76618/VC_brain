'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock,
  FlaskConical,
  Gauge,
  Inbox,
  Play,
  Radar,
  RefreshCw,
  Timer,
  TrendingUp,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import {
  fmtDuration,
  getPipeline,
  runDiligence,
  seedDemo,
  type PipelineView,
} from '@/lib/vcApi';

const STAGES: { id: 'sourcing' | 'screening' | 'diligence' | 'decision'; label: string; color: string }[] = [
  { id: 'sourcing', label: 'Sourcing', color: '#7c3aed' },
  { id: 'screening', label: 'Screening', color: '#4f46e5' },
  { id: 'diligence', label: 'Diligence', color: '#d97706' },
  { id: 'decision', label: 'Decision', color: '#0d9488' },
];

const ROUTE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  advance: { label: 'Advance', color: '#0d9488', bg: 'rgba(13,148,136,0.1)' },
  founder_call_pivot: { label: 'Founder call', color: '#4f46e5', bg: 'rgba(79,70,229,0.1)' },
  request_evidence: { label: 'Request evidence', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  hold: { label: 'HOLD — human review', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
};

function MetricCard({
  icon: IconCmp,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 min-w-[180px]">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(79,70,229,0.1)' }}
      >
        <IconCmp size={15} style={{ color: '#4f46e5' }} />
      </div>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
        {hint && <p className="text-[10px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [view, setView] = useState<PipelineView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getPipeline().then(setView).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSeed = async () => {
    setBusy('Seeding synthetic company + extracting claims…');
    setError(null);
    try {
      await seedDemo();
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleDiligence = async (id: string) => {
    setBusy('Running Validator → Adjudicator → Screener → Memo…');
    setError(null);
    try {
      await runDiligence(id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const metrics = view?.metrics;

  return (
    <AppShell topic="Deal pipeline" agentStatus={busy ? 'running' : 'idle'}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with time-to-decision instrumentation */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="eyebrow mb-1">Sourcing → Screening → Diligence → Decision</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pipeline</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-subtle text-xs font-medium text-foreground hover:bg-white/80 transition-colors"
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              onClick={handleSeed}
              disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              <FlaskConical size={12} /> Seed synthetic deal
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <MetricCard
            icon={Timer}
            label="Median signal → decision"
            value={fmtDuration(metrics?.median_signal_to_decision_ms ?? null)}
            hint="from logged stage transitions"
          />
          <MetricCard
            icon={Gauge}
            label="Decided within 24h"
            value={metrics ? `${metrics.decided_within_24h} of ${metrics.decided}` : '—'}
          />
          <MetricCard
            icon={TrendingUp}
            label="Bottleneck stage"
            value={metrics?.bottleneck ? metrics.bottleneck.stage : '—'}
            hint={metrics?.bottleneck ? `median dwell ${fmtDuration(metrics.bottleneck.median_dwell_ms)}` : undefined}
          />
        </div>

        {busy && (
          <div className="glass rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full animate-thinking" style={{ background: '#4f46e5' }} />
            <p className="text-xs text-muted-foreground">{busy}</p>
          </div>
        )}
        {error && (
          <div className="critique-contradiction rounded-xl px-4 py-3 mb-6">
            <p className="text-xs font-medium" style={{ color: '#dc2626' }}>
              {error}
            </p>
          </div>
        )}

        {/* Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STAGES.map((stage) => {
            const cards = (view?.opportunities ?? []).filter((o) => o.stage === stage.id);
            return (
              <div key={stage.id} className="glass-subtle rounded-2xl p-3 min-h-[280px]">
                <div className="flex items-center justify-between px-1 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <p className="text-xs font-semibold text-foreground">{stage.label}</p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{cards.length}</span>
                </div>

                <div className="space-y-2">
                  {cards.map((o) => {
                    const route = o.routing ? ROUTE_LABELS[o.routing.route] : null;
                    const firstSignal = o.transitions.find((t) => t.to === 'first_signal');
                    const last = o.transitions[o.transitions.length - 1];
                    const elapsed =
                      firstSignal && last
                        ? new Date(last.at).getTime() - new Date(firstSignal.at).getTime()
                        : null;
                    return (
                      <motion.div key={o.opportunity_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <Link href={`/opportunity/${o.opportunity_id}`} className="block">
                          <div className="glass glass-hover rounded-xl p-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {o.company?.canonical_name ?? 'Unknown'}
                              </p>
                              <span
                                className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-md shrink-0"
                                style={{
                                  color: o.entry_point === 'outbound' ? '#7c3aed' : '#0d9488',
                                  background: o.entry_point === 'outbound' ? 'rgba(124,58,237,0.1)' : 'rgba(13,148,136,0.1)',
                                }}
                              >
                                {o.entry_point === 'outbound' ? <Radar size={9} /> : <Inbox size={9} />}
                                {o.entry_point}
                              </span>
                            </div>
                            {o.company?.primary_domain && (
                              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{o.company.primary_domain}</p>
                            )}
                            <div className="flex items-center justify-between mt-2.5">
                              {route ? (
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                                  style={{ color: route.color, background: route.bg }}
                                >
                                  {route.label}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">awaiting diligence</span>
                              )}
                              {elapsed !== null && (
                                <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                  <Clock size={9} /> {fmtDuration(elapsed)}
                                </span>
                              )}
                            </div>
                            {!o.routing && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDiligence(o.opportunity_id);
                                }}
                                disabled={!!busy}
                                className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                                style={{ color: '#4f46e5', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.15)' }}
                              >
                                <Play size={10} /> Run diligence
                              </button>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                  {cards.length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center py-8">No opportunities</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(view?.opportunities ?? []).length === 0 && !busy && (
          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground">
              Empty pipeline — seed the synthetic demo deal to run the full diligence chain.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
