'use client';
import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Coverage', value: 87, fill: 'var(--primary)' },
  { name: 'bg', value: 100, fill: 'var(--muted)' },
];

export default function CoverageChart() {
  return (
    <div className="relative flex items-center justify-center h-20">
      <ResponsiveContainer width="100%" height={80}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          data={data}
          barSize={8}
        >
          <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'var(--muted)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums text-foreground">87%</span>
        <span className="text-[9px] font-mono text-muted-foreground">coverage</span>
      </div>
    </div>
  );
}