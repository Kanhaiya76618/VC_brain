'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const CoverageChart = dynamic(() => import('./CoverageChart'), { ssr: false });

export default function CoverageWidget() {
  return (
    <div className="glass-panel rounded-xl p-3 border border-border">
      <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground mb-1">
        Coverage Score
      </p>
      <CoverageChart />
      <div className="grid grid-cols-2 gap-2 mt-2">
        {[
          { label: 'Foundational', val: 94, color: 'text-success' },
          { label: 'Intermediate', val: 81, color: 'text-success' },
          { label: 'Advanced', val: 68, color: 'text-amber-400' },
          { label: 'Counter-evidence', val: 52, color: 'text-red-400' },
        ]?.map((item) => (
          <div key={`cov-${item?.label}`}>
            <p className="text-[9px] font-mono text-muted-foreground">{item?.label}</p>
            <p className={`text-xs font-mono font-bold tabular-nums ${item?.color}`}>{item?.val}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}