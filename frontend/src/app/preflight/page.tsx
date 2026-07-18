'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { ClipboardCheck, AlertTriangle, Loader2, ListOrdered, Scale, Target, BookOpen, ArrowRight } from 'lucide-react';
import { planExperiment, type ExperimentPlan } from '@/lib/api';
import { getStudentId } from '@/lib/studentId';

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
};

function BulletSection({ icon: Icon, color, title, items }: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl p-4" style={glass}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} style={{ color } as React.CSSProperties} />
        <span className="text-xs font-bold text-[#1d1d1f]">{title}</span>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-[#3d3d3f] leading-relaxed flex gap-2">
              <span className="font-bold shrink-0" style={{ color }}>•</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[#6e6e73]">None noted.</p>
      )}
    </div>
  );
}

export default function PreFlightPage() {
  const [objective, setObjective] = useState('');
  const [approach, setApproach] = useState('');
  const [constraints, setConstraints] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ExperimentPlan | null>(null);

  const canSubmit = objective.trim() && approach.trim() && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      setPlan(
        await planExperiment({
          objective: objective.trim(),
          plannedApproach: approach.trim(),
          constraints: constraints.trim() || undefined,
          studentId: getStudentId(),
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell topic="PreFlight — experiment planner" agentStatus={loading ? 'running' : 'idle'}>
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck size={16} className="text-[#0d9488]" />
          <h1 className="text-lg font-bold text-[#1d1d1f]">PreFlight</h1>
        </div>

        {/* Proposal form */}
        <form onSubmit={submit} className="rounded-2xl p-4 mb-5" style={glass}>
          <label htmlFor="pf-objective" className="eyebrow block mb-1">Objective</label>
          <input
            id="pf-objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. improve translation quality on my low-resource pair"
            className="w-full text-xs rounded-xl p-2.5 mb-3 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#0d9488]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e]"
            disabled={loading}
          />
          <label htmlFor="pf-approach" className="eyebrow block mb-1">Planned approach</label>
          <textarea
            id="pf-approach"
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            rows={3}
            placeholder="e.g. train a larger transformer on the same 10k sentence pairs with more epochs"
            className="w-full text-xs leading-relaxed rounded-xl p-2.5 mb-3 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#0d9488]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e] resize-y"
            disabled={loading}
          />
          <label htmlFor="pf-constraints" className="eyebrow block mb-1">Constraints (optional)</label>
          <input
            id="pf-constraints"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="e.g. one GPU, two weeks"
            className="w-full text-xs rounded-xl p-2.5 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#0d9488]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-3 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98]"
            style={{ background: '#0d9488' }}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {loading ? 'Checking plan…' : 'Run pre-flight check'}
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

        {!plan && !loading && !error && (
          <div className="rounded-2xl p-6 text-center" style={glass}>
            <ClipboardCheck size={20} className="text-[#0d9488] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1d1d1f] mb-1">No plan checked yet</p>
            <p className="text-xs text-[#6e6e73] max-w-sm mx-auto leading-relaxed">
              Describe an experiment before running it. The Planner turns it into milestones with
              controls and falsifiable success criteria — and warns you if it repeats a failure
              already in your archive.
            </p>
          </div>
        )}

        <AnimatePresence>
          {plan && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-4"
            >
              {/* Archive warnings — loudest element on the page */}
              {plan.archiveWarnings.length > 0 && (
                <motion.div
                  initial={{ scale: 0.97 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  role="alert"
                  className="rounded-2xl p-5"
                  style={{
                    background: 'rgba(220,38,38,0.08)',
                    border: '2px solid rgba(220,38,38,0.45)',
                    boxShadow: '0 8px 32px rgba(220,38,38,0.15)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-[#dc2626]" />
                    <span className="text-sm font-bold text-[#dc2626]">
                      ⚠ You may be repeating a dead end:
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {plan.archiveWarnings.map((w, i) => (
                      <li key={i} className="text-xs text-[#7a1d1d] leading-relaxed font-medium flex gap-2">
                        <span className="text-[#dc2626] font-bold shrink-0">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Prereq gaps — study first */}
              {plan.prereqGaps.length > 0 && (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(79,70,229,0.06)',
                    border: '1px solid rgba(79,70,229,0.25)',
                    borderLeft: '4px solid #4f46e5',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen size={13} className="text-[#4f46e5]" />
                    <span className="text-xs font-bold text-[#1d1d1f]">Study first</span>
                  </div>
                  <ul className="space-y-1.5 mb-3">
                    {plan.prereqGaps.map((g, i) => (
                      <li key={i} className="text-xs text-[#3d3d3f] leading-relaxed flex gap-2">
                        <span className="text-[#4f46e5] font-bold shrink-0">•</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/curriculum-view"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4f46e5] hover:text-[#7c3aed] transition-colors"
                  >
                    Open your curriculum <ArrowRight size={11} />
                  </Link>
                </div>
              )}

              <BulletSection icon={ListOrdered} color="#0d9488" title="Milestones" items={plan.milestones} />
              <BulletSection icon={Scale} color="#d97706" title="Controls" items={plan.controls} />
              <BulletSection icon={Target} color="#4f46e5" title="Success criteria" items={plan.successCriteria} />

              <p className="text-[9px] font-mono text-[#9a9a9e]">
                Plan checked {new Date(plan.createdAt).toLocaleString()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
