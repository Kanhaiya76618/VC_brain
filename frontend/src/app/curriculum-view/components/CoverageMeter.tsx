'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Zap, Target } from 'lucide-react';
import { MOCK_CURRICULUM } from '@/lib/mock/data'; // TODO(mock): no backend endpoint provides this data yet
import Icon from '@/components/ui/AppIcon';


export default function CoverageMeter() {
  const { coveragePercent, gapCount, contradictionCount, totalPapers } = MOCK_CURRICULUM;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (coveragePercent / 100) * circumference;

  const healthColor = coveragePercent >= 80 ? '#0d9488' : coveragePercent >= 60 ? '#d97706' : '#dc2626';

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Target size={13} className="text-[#4f46e5]" />
        <span className="text-xs font-semibold text-[#1d1d1f]">Coverage Health</span>
      </div>

      {/* Ring */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="coverage-ring">
            {/* Track */}
            <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
            {/* Progress */}
            <motion.circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke={healthColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              transform="rotate(-90 44 44)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold" style={{ color: healthColor }}>{coveragePercent}%</span>
            <span className="text-[8px] font-mono text-[#6e6e73]">coverage</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {[
            { label: 'Papers', value: totalPapers, color: '#4f46e5', icon: TrendingUp },
            { label: 'Gaps', value: gapCount, color: '#d97706', icon: AlertTriangle },
            { label: 'Contradictions', value: contradictionCount, color: '#dc2626', icon: Zap },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2">
                <Icon size={10} style={{ color: item.color } as React.CSSProperties} />
                <span className="text-[10px] text-[#6e6e73] flex-1">{item.label}</span>
                <span className="text-[11px] font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health bar */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-[10px] font-mono text-[#6e6e73]">Overall health</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: healthColor }}>
            {coveragePercent >= 80 ? 'Good' : coveragePercent >= 60 ? 'Fair' : 'Needs work'}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-black/8 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${healthColor}, ${healthColor}aa)` }}
            initial={{ width: 0 }}
            animate={{ width: `${coveragePercent}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
