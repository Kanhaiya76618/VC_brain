'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { FlaskConical, AlertTriangle, Loader2, Repeat } from 'lucide-react';
import { logExperiment, type ArchiveEntry } from '@/lib/api';
import { getStudentId } from '@/lib/studentId';

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
};

function EntryCard({ entry }: { entry: ArchiveEntry }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-2xl p-4"
      style={glass}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-[#1d1d1f] leading-tight flex-1 min-w-0">{entry.attempted}</p>
        <span
          className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md shrink-0"
          style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706', border: '1px solid rgba(217,119,6,0.2)' }}
        >
          {entry.failureMode}
        </span>
      </div>
      <p className="text-[10px] font-mono text-[#6e6e73] mt-1">
        Hypothesis: {entry.hypothesis} · Outcome: {entry.outcome}
      </p>
      <p className="text-[11px] text-[#3d3d3f] leading-relaxed mt-2">{entry.lesson}</p>

      {entry.similarPriorAttempts.length > 0 && (
        <div
          className="mt-3 rounded-xl p-3"
          style={{
            background: 'rgba(220,38,38,0.07)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderLeft: '4px solid #dc2626',
          }}
          role="status"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Repeat size={12} className="text-[#dc2626]" />
            <span className="text-[11px] font-bold text-[#dc2626]">
              Echoes {entry.similarPriorAttempts.length} earlier attempt{entry.similarPriorAttempts.length > 1 ? 's' : ''}
            </span>
          </div>
          <ul className="space-y-0.5">
            {entry.similarPriorAttempts.map((a, i) => (
              <li key={i} className="text-[11px] text-[#7a1d1d] leading-relaxed">
                • {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[9px] font-mono text-[#9a9a9e] mt-2">{new Date(entry.loggedAt).toLocaleString()}</p>
    </motion.div>
  );
}

export default function ArchivePage() {
  const [attempted, setAttempted] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [outcome, setOutcome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);

  const canSubmit = attempted.trim() && hypothesis.trim() && outcome.trim() && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const entry = await logExperiment({
        attempted: attempted.trim(),
        hypothesis: hypothesis.trim(),
        outcome: outcome.trim(),
        studentId: getStudentId(),
      });
      setEntries((prev) => [entry, ...prev]);
      setAttempted('');
      setHypothesis('');
      setOutcome('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell topic="Negative Results Archive" agentStatus={loading ? 'running' : 'idle'}>
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={16} className="text-[#d97706]" />
          <h1 className="text-lg font-bold text-[#1d1d1f]">Negative Results Archive</h1>
        </div>

        {/* Log form */}
        <form onSubmit={submit} className="rounded-2xl p-4 mb-5" style={glass}>
          <label htmlFor="arc-attempted" className="eyebrow block mb-1">What did you attempt?</label>
          <input
            id="arc-attempted"
            value={attempted}
            onChange={(e) => setAttempted(e.target.value)}
            placeholder="e.g. trained a 6-layer transformer on 10k sentence pairs"
            className="w-full text-xs rounded-xl p-2.5 mb-3 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#d97706]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e]"
            disabled={loading}
          />
          <label htmlFor="arc-hypothesis" className="eyebrow block mb-1">What did you expect?</label>
          <input
            id="arc-hypothesis"
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            placeholder="e.g. expected BLEU > 20"
            className="w-full text-xs rounded-xl p-2.5 mb-3 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#d97706]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e]"
            disabled={loading}
          />
          <label htmlFor="arc-outcome" className="eyebrow block mb-1">What actually happened?</label>
          <textarea
            id="arc-outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            rows={3}
            placeholder="e.g. BLEU plateaued at 4, model memorized the training set"
            className="w-full text-xs leading-relaxed rounded-xl p-2.5 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#d97706]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e] resize-y"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-3 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98]"
            style={{ background: '#d97706' }}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {loading ? 'Archiving…' : 'Log to archive'}
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
        </form>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={glass}>
            <FlaskConical size={20} className="text-[#d97706] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1d1d1f] mb-1">Nothing archived this session</p>
            <p className="text-xs text-[#6e6e73] max-w-sm mx-auto leading-relaxed">
              Log failed experiments here. The Archivist Agent names the failure mode, extracts the
              lesson — and warns you loudly when a new attempt repeats an old dead end.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {entries.map((e) => (
                <EntryCard key={e.loggedAt + e.attempted} entry={e} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppShell>
  );
}
