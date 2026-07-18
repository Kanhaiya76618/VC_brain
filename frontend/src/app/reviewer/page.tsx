'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { Glasses, AlertTriangle, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { generateReviewExercise, gradeReview, type ReviewExercise, type ReviewGrade } from '@/lib/api';
import { getStudentId } from '@/lib/studentId';

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
};

function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}
    >
      <AlertTriangle size={12} className="text-[#dc2626] shrink-0 mt-0.5" />
      <p className="text-[11px] text-[#dc2626] leading-relaxed">{message}</p>
    </div>
  );
}

function ResultList({ title, items, color, icon: Icon }: {
  title: string;
  items: string[];
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl p-4" style={{ ...glass, borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} style={{ color } as React.CSSProperties} />
        <span className="text-xs font-bold text-[#1d1d1f]">{title}</span>
        <span className="text-[10px] font-mono font-semibold px-1.5 rounded-full" style={{ background: `${color}15`, color }}>
          {items.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-[#3d3d3f] leading-relaxed flex gap-2">
            <span className="font-bold shrink-0" style={{ color }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReviewerPage() {
  const [topicHint, setTopicHint] = useState('');
  const [exercise, setExercise] = useState<ReviewExercise | null>(null);
  const [review, setReview] = useState('');
  const [grade, setGrade] = useState<ReviewGrade | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (genLoading) return;
    setGenLoading(true);
    setError(null);
    setGrade(null);
    setReview('');
    try {
      setExercise(await generateReviewExercise(getStudentId(), topicHint.trim() || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenLoading(false);
    }
  };

  const submitReview = async () => {
    if (!exercise || !review.trim() || gradeLoading) return;
    setGradeLoading(true);
    setError(null);
    try {
      setGrade(await gradeReview(exercise, review.trim(), getStudentId()));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGradeLoading(false);
    }
  };

  const reset = () => {
    setExercise(null);
    setGrade(null);
    setReview('');
    setError(null);
  };

  return (
    <AppShell topic="ReviewerZero — spot the flaws" agentStatus={genLoading || gradeLoading ? 'running' : 'idle'}>
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Glasses size={16} className="text-[#7c3aed]" />
          <h1 className="text-lg font-bold text-[#1d1d1f]">ReviewerZero</h1>
        </div>

        {/* Generate controls */}
        {!exercise && (
          <div className="rounded-2xl p-4 mb-5" style={glass}>
            <label htmlFor="rz-topic" className="eyebrow block mb-1">Topic hint (optional)</label>
            <div className="flex items-center gap-2">
              <input
                id="rz-topic"
                value={topicHint}
                onChange={(e) => setTopicHint(e.target.value)}
                placeholder="e.g. attention mechanisms"
                className="flex-1 min-w-0 text-xs rounded-xl p-2.5 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#7c3aed]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e]"
                disabled={genLoading}
              />
              <button
                onClick={generate}
                disabled={genLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98] shrink-0"
                style={{ background: '#7c3aed' }}
              >
                {genLoading && <Loader2 size={12} className="animate-spin" />}
                {genLoading ? 'Writing…' : 'Generate exercise'}
              </button>
            </div>
            {error && <InlineError message={error} />}
            {!genLoading && !error && (
              <p className="text-[10px] text-[#6e6e73] mt-3 leading-relaxed">
                ReviewerZero writes a short fictional excerpt with exactly 3 planted flaws. Read it
                like a peer reviewer, write up what&apos;s wrong, then get graded on what you caught —
                and what you systematically miss.
              </p>
            )}
          </div>
        )}

        {/* Exercise + review */}
        <AnimatePresence>
          {exercise && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-4"
            >
              <div className="rounded-2xl p-5" style={glass}>
                <p className="eyebrow mb-2">Fictional excerpt — find the 3 planted flaws</p>
                <p className="text-xs text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">{exercise.excerpt}</p>
              </div>

              {!grade && (
                <div className="rounded-2xl p-4" style={glass}>
                  <label htmlFor="rz-review" className="eyebrow block mb-1.5">Your review</label>
                  <textarea
                    id="rz-review"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={5}
                    placeholder="What's wrong with this excerpt? Point at specific sentences."
                    className="w-full text-xs leading-relaxed rounded-xl p-2.5 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#7c3aed]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e] resize-y"
                    disabled={gradeLoading}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={submitReview}
                      disabled={!review.trim() || gradeLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98]"
                      style={{ background: '#7c3aed' }}
                    >
                      {gradeLoading && <Loader2 size={12} className="animate-spin" />}
                      {gradeLoading ? 'Grading…' : 'Submit review'}
                    </button>
                    <button
                      onClick={reset}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6e6e73] bg-black/5 hover:bg-black/8 transition-all duration-150"
                    >
                      <RotateCcw size={11} /> Start over
                    </button>
                  </div>
                  {error && <InlineError message={error} />}
                </div>
              )}

              {/* Results */}
              {grade && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="space-y-4"
                >
                  <div
                    className="rounded-2xl p-5 flex items-center justify-between gap-4"
                    style={{ ...glass, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    <div>
                      <p className="eyebrow mb-1">Your score</p>
                      <p className="text-2xl font-bold text-[#7c3aed]">
                        {grade.caught.length}/{exercise.plantedFlaws.length}
                        <span className="text-sm font-mono text-[#6e6e73] ml-2">({grade.score})</span>
                      </p>
                    </div>
                    <p className="text-xs text-[#3d3d3f] leading-relaxed flex-1">{grade.coaching}</p>
                  </div>

                  <ResultList title="Caught" items={grade.caught} color="#0d9488" icon={CheckCircle} />
                  <ResultList title="Missed" items={grade.missed} color="#dc2626" icon={XCircle} />
                  <ResultList title="False positives" items={grade.falsePositives} color="#d97706" icon={AlertTriangle} />

                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                    style={{ background: '#7c3aed' }}
                  >
                    <RotateCcw size={12} /> Try another
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
