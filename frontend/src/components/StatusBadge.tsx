'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface StatusBadgeProps {
  status: 'idle' | 'running' | 'done' | 'error';
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG = {
  idle: { color: '#6e6e73', bg: 'rgba(110,110,115,0.1)', border: 'rgba(110,110,115,0.2)', label: 'Idle', dot: '#6e6e73' },
  running: { color: '#4f46e5', bg: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.2)', label: 'Running', dot: '#4f46e5' },
  done: { color: '#0d9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.2)', label: 'Done', dot: '#0d9488' },
  error: { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)', label: 'Error', dot: '#dc2626' },
};

export default function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const displayLabel = label ?? cfg.label;

  return (
    <div
      className="flex items-center gap-1.5 rounded-full"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
      }}
    >
      <div className="relative flex items-center justify-center">
        <div
          className="rounded-full"
          style={{
            width: size === 'sm' ? 6 : 8,
            height: size === 'sm' ? 6 : 8,
            background: cfg.dot,
          }}
        />
        {status === 'running' && (
          <motion.div
            className="absolute rounded-full"
            style={{ background: cfg.dot, width: size === 'sm' ? 6 : 8, height: size === 'sm' ? 6 : 8 }}
            animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
      <span
        className="font-mono font-medium"
        style={{ fontSize: size === 'sm' ? 10 : 11, color: cfg.color }}
      >
        {displayLabel}
      </span>
    </div>
  );
}
