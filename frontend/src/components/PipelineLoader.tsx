'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Circle } from 'lucide-react';

interface PipelineLoaderProps {
  state: 'running' | 'done';
  onComplete?: () => void;
}

const STAGES = [
  { id: 'fetch', label: 'Fetching Papers', sublabel: 'arXiv + Semantic Scholar', color: '#4f46e5' },
  { id: 'rank', label: 'Ranking by Relevance', sublabel: 'Citation graph + semantic similarity', color: '#7c3aed' },
  { id: 'sequence', label: 'Sequencing Curriculum', sublabel: 'Foundational → Advanced ordering', color: '#0d9488' },
  { id: 'graph', label: 'Building Knowledge Graph', sublabel: 'Extracting concept relationships', color: '#d97706' },
  { id: 'critique', label: 'Running Critic Agent', sublabel: 'Flagging gaps & contradictions', color: '#dc2626' },
];

export default function PipelineLoader({ state, onComplete }: PipelineLoaderProps) {
  const [activeStage, setActiveStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  useEffect(() => {
    if (state !== 'running') return;
    setActiveStage(0);
    setCompletedStages([]);

    const timings = [0, 900, 1800, 2700, 3500];
    const completionTimings = [700, 1600, 2500, 3300, 4100];

    const advanceTimers = timings.map((t, i) =>
      setTimeout(() => setActiveStage(i), t)
    );
    const completeTimers = completionTimings.map((t, i) =>
      setTimeout(() => setCompletedStages((prev) => [...prev, i]), t)
    );
    const doneTimer = setTimeout(() => onComplete?.(), 4400);

    return () => {
      [...advanceTimers, ...completeTimers, doneTimer].forEach(clearTimeout);
    };
  }, [state, onComplete]);

  const isDone = state === 'done';

  return (
    <div
      className="rounded-2xl p-4 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#4f46e5] animate-pulse" />
        <span className="text-xs font-semibold text-[#1d1d1f]">
          {isDone ? 'Pipeline Complete' : 'Running Research Pipeline'}
        </span>
      </div>

      {/* Stage nodes connected by line */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-black/8 rounded-full" />
        <motion.div
          className="absolute top-4 left-4 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #4f46e5, #0d9488)' }}
          initial={{ width: '0%' }}
          animate={{
            width: isDone
              ? '100%'
              : `${(completedStages.length / STAGES.length) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />

        {/* Stage dots */}
        <div className="relative flex justify-between">
          {STAGES.map((stage, i) => {
            const isComplete = completedStages.includes(i) || isDone;
            const isActive = activeStage === i && !isComplete;

            return (
              <div key={stage.id} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / STAGES.length}%` }}>
                <motion.div
                  className="w-8 h-8 rounded-full flex items-center justify-center relative z-10"
                  animate={{
                    scale: isActive ? [1, 1.15, 1] : 1,
                    background: isComplete
                      ? stage.color
                      : isActive
                      ? `${stage.color}20`
                      : 'rgba(255,255,255,0.8)',
                  }}
                  transition={isActive ? { duration: 1, repeat: Infinity } : { duration: 0.3 }}
                  style={{
                    border: isComplete
                      ? `2px solid ${stage.color}`
                      : isActive
                      ? `2px solid ${stage.color}`
                      : '2px solid rgba(0,0,0,0.1)',
                    boxShadow: isActive ? `0 0 12px ${stage.color}40` : 'none',
                  }}
                >
                  {isComplete ? (
                    <CheckCircle size={14} style={{ color: 'white' } as React.CSSProperties} />
                  ) : isActive ? (
                    <Loader2 size={12} className="animate-spin" style={{ color: stage.color } as React.CSSProperties} />
                  ) : (
                    <Circle size={10} className="text-[#6e6e73]/40" />
                  )}
                </motion.div>

                <div className="text-center px-1">
                  <p
                    className="text-[9px] font-semibold leading-tight"
                    style={{ color: isComplete || isActive ? '#1d1d1f' : '#6e6e73' }}
                  >
                    {stage.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
