'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { Landmark, AlertTriangle, Loader2, Microscope, Megaphone, CalendarClock, ListOrdered, RotateCcw } from 'lucide-react';
import { reviewProposal, type PanelVerdict } from '@/lib/api';
import { getStudentId } from '@/lib/studentId';

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
};

const PANELISTS = {
  methods_skeptic: { label: 'Methods Skeptic', icon: Microscope, color: '#4f46e5' },
  impact_skeptic: { label: 'Impact Skeptic', icon: Megaphone, color: '#d97706' },
  feasibility_skeptic: { label: 'Feasibility Skeptic', icon: CalendarClock, color: '#0d9488' },
} as const;

const SEVERITY = {
  minor: { color: '#6e6e73', bg: 'rgba(110,110,115,0.1)', ring: 'transparent' },
  major: { color: '#d97706', bg: 'rgba(217,119,6,0.12)', ring: 'rgba(217,119,6,0.3)' },
  blocking: { color: '#dc2626', bg: 'rgba(220,38,38,0.14)', ring: 'rgba(220,38,38,0.5)' },
} as const;

const VERDICTS = {
  fund: { label: 'FUND', color: '#0d9488', bg: 'rgba(13,148,136,0.1)', note: 'The panel would fund this.' },
  revise_and_resubmit: { label: 'REVISE & RESUBMIT', color: '#d97706', bg: 'rgba(217,119,6,0.1)', note: 'Address the priorities below and face the panel again.' },
  reject: { label: 'REJECT', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', note: 'The panel sees fundamental problems — rethink the proposal.' },
} as const;

export default function GrantCraftPage() {
  const [proposal, setProposal] = useState('');
  const [verdict, setVerdict] = useState<PanelVerdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!proposal.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      setVerdict(await reviewProposal(proposal.trim(), getStudentId()));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const vCfg = verdict ? VERDICTS[verdict.verdict] : null;

  return (
    <AppShell topic="GrantCraft Junior — face the panel" agentStatus={loading ? 'running' : 'idle'}>
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={16} className="text-[#4f46e5]" />
          <h1 className="text-lg font-bold text-[#1d1d1f]">GrantCraft Junior</h1>
        </div>

        {/* Proposal form */}
        <div className="rounded-2xl p-4 mb-5" style={glass}>
          <label htmlFor="gc-proposal" className="eyebrow block mb-1">Your proposal</label>
          <textarea
            id="gc-proposal"
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            rows={7}
            placeholder="Describe what you want to do, why it matters, and how you'll do it."
            className="w-full text-xs leading-relaxed rounded-xl p-2.5 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#4f46e5]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e] resize-y"
            disabled={loading}
          />
          <p className="text-[10px] text-[#9a9a9e] mt-1.5">
            Tip: paste your PreFlight plan here, or write fresh.
          </p>
          <button
            onClick={submit}
            disabled={!proposal.trim() || loading}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {loading ? 'Panel deliberating…' : 'Face the panel'}
          </button>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
                className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}
              >
                <AlertTriangle size={12} className="text-[#dc2626] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#dc2626] leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!verdict && !loading && !error && (
          <div className="rounded-2xl p-6 text-center" style={glass}>
            <Landmark size={20} className="text-[#4f46e5] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1d1d1f] mb-1">The panel awaits</p>
            <p className="text-xs text-[#6e6e73] max-w-sm mx-auto leading-relaxed">
              Three skeptics — methods, impact, feasibility — attack your proposal until it survives.
              They know your archived failures and prior plans, and they will bring them up.
            </p>
          </div>
        )}

        <AnimatePresence>
          {verdict && vCfg && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-4"
            >
              {/* Verdict banner */}
              <div
                className="rounded-2xl p-5 flex items-center justify-between gap-4"
                style={{ ...glass, background: vCfg.bg, border: `1.5px solid ${vCfg.color}40` }}
              >
                <div>
                  <p className="text-xl font-bold tracking-wide" style={{ color: vCfg.color }}>{vCfg.label}</p>
                  <p className="text-xs text-[#3d3d3f] mt-1">{vCfg.note}</p>
                </div>
                <button
                  onClick={() => setVerdict(null)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-150 active:scale-[0.98] shrink-0"
                  style={{ background: vCfg.color }}
                >
                  <RotateCcw size={12} /> Revise and resubmit
                </button>
              </div>

              {/* Objections */}
              {verdict.objections.map((o, i) => {
                const p = PANELISTS[o.panelist];
                const s = SEVERITY[o.severity];
                const PIcon = p.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 28 }}
                    className="rounded-2xl p-4"
                    style={{
                      ...glass,
                      borderLeft: `4px solid ${p.color}`,
                      boxShadow: o.severity === 'blocking' ? `0 4px 24px ${s.ring}` : (glass.boxShadow as string),
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <PIcon size={13} style={{ color: p.color } as React.CSSProperties} />
                      <span className="text-xs font-bold text-[#1d1d1f]">{p.label}</span>
                      <span
                        className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {o.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[#3d3d3f] leading-relaxed">{o.objection}</p>
                  </motion.div>
                );
              })}

              {/* Revision priorities */}
              <div className="rounded-2xl p-4" style={glass}>
                <div className="flex items-center gap-1.5 mb-2">
                  <ListOrdered size={13} className="text-[#4f46e5]" />
                  <span className="text-xs font-bold text-[#1d1d1f]">Revision priorities</span>
                </div>
                {verdict.revisionPriorities.length > 0 ? (
                  <ol className="space-y-1.5">
                    {verdict.revisionPriorities.map((r, i) => (
                      <li key={i} className="text-xs text-[#3d3d3f] leading-relaxed flex gap-2">
                        <span className="font-mono font-bold text-[#4f46e5] shrink-0">{i + 1}.</span>
                        {r}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-[#6e6e73]">None — the panel had no revisions to demand.</p>
                )}
              </div>

              <p className="text-[9px] font-mono text-[#9a9a9e]">
                Reviewed {new Date(verdict.reviewedAt).toLocaleString()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
