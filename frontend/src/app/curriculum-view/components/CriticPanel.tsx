'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, AlertTriangle, Zap, Clock, Shield, Loader2 } from 'lucide-react';
import { critiqueDraft, type DraftCritique, type CritiqueFlag } from '@/lib/api';
import { getStudentId } from '@/lib/studentId';

const TYPE_CONFIG: Record<CritiqueFlag['type'], { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>, color: string, bg: string, label: string }> = {
  uncited_claim: { icon: AlertTriangle, color: '#d97706', bg: 'rgba(217,119,6,0.08)', label: 'Uncited claim' },
  overclaiming: { icon: Zap, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'Overclaiming' },
  unreproducible_method: { icon: Clock, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', label: 'Unreproducible' },
  structure: { icon: Shield, color: '#6e6e73', bg: 'rgba(110,110,115,0.08)', label: 'Structure' },
};

const SEVERITY_DOTS: Record<CritiqueFlag['severity'], string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#6e6e73',
};

function FlagCard({ flag }: { flag: CritiqueFlag }) {
  const cfg = TYPE_CONFIG[flag.type];
  const FlagIcon = cfg.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-xl p-3 mb-2"
      style={{ background: cfg.bg, border: `1px solid ${cfg.color}20`, borderLeft: `3px solid ${cfg.color}` }}
    >
      <div className="flex items-start gap-2">
        <FlagIcon size={12} className="shrink-0" style={{ color: cfg.color, marginTop: 2 } as React.CSSProperties} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `${cfg.color}15`, color: cfg.color }}>
              {cfg.label}
            </span>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_DOTS[flag.severity] }} />
            <span className="text-[9px] font-mono text-[#6e6e73] capitalize">{flag.severity}</span>
          </div>
          <p className="text-[10px] italic text-[#3d3d3f] leading-relaxed mb-1">&ldquo;{flag.excerpt}&rdquo;</p>
          <p className="text-[10px] text-[#6e6e73] leading-relaxed">{flag.note}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function CriticPanel() {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [critique, setCritique] = useState<DraftCritique | null>(null);

  const run = async () => {
    if (!draft.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      setCritique(await critiqueDraft(draft.trim(), getStudentId()));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 border-b border-black/6 hover:bg-black/3 transition-colors"
        aria-expanded={open}
      >
        <MessageSquare size={13} className="text-[#dc2626]" />
        <span className="text-xs font-semibold text-[#1d1d1f] flex-1 text-left">Critic Agent</span>
        {critique && critique.flags.length > 0 && (
          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(220,38,38,0.1)] text-[#dc2626]">
            {critique.flags.length}
          </span>
        )}
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
          <X size={12} className="text-[#6e6e73]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              <label htmlFor="critic-draft" className="text-[10px] font-mono font-semibold text-[#6e6e73] uppercase tracking-wide block mb-1.5">
                Paste your draft
              </label>
              <textarea
                id="critic-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                placeholder="Paste a paragraph or your full draft — the Critic flags uncited claims, overclaiming, unreproducible methods, and structural gaps."
                className="w-full text-[11px] leading-relaxed rounded-xl p-2.5 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#dc2626]/30 text-[#1d1d1f] placeholder:text-[#9a9a9e] resize-y"
                disabled={loading}
              />
              <button
                onClick={run}
                disabled={!draft.trim() || loading}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98]"
                style={{ background: '#dc2626' }}
              >
                {loading && <Loader2 size={11} className="animate-spin" />}
                {loading ? 'Critiquing…' : 'Run critique'}
              </button>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 mt-2 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}
                >
                  <AlertTriangle size={11} className="text-[#dc2626] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#dc2626] leading-relaxed">{error}</p>
                </div>
              )}

              {critique && !loading && (
                <div className="mt-3">
                  <div className="rounded-xl p-3 mb-3 bg-black/3 border border-black/6">
                    <p className="text-[10px] text-[#3d3d3f] leading-relaxed">{critique.structureSummary}</p>
                  </div>
                  {critique.flags.length > 0 ? (
                    critique.flags.map((flag, i) => <FlagCard key={i} flag={flag} />)
                  ) : (
                    <p className="text-[10px] text-[#6e6e73] text-center py-2">No issues flagged.</p>
                  )}
                  <div className="rounded-xl p-3 mt-1" style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.12)' }}>
                    <p className="text-[10px] text-[#3d3d3f] leading-relaxed">{critique.overallAssessment}</p>
                  </div>
                </div>
              )}

              {!critique && !loading && !error && (
                <p className="text-[10px] text-[#6e6e73] text-center pt-3 pb-1">
                  No critique yet — paste a draft above and run it.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
