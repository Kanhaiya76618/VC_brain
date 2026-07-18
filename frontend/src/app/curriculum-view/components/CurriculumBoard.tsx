'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, ExternalLink, BookOpen, ListOrdered, HelpCircle, Wrench, Search } from 'lucide-react';
import type { LearningPath, LearningNode } from '@/lib/api';

function NodeCard({ node, index }: { node: LearningNode; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.05 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-black/3 transition-colors"
        aria-expanded={expanded}
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: '#4f46e5' }}
        >
          {node.order}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1d1d1f] truncate">{node.title}</p>
          {node.arxivId && (
            <p className="text-[10px] font-mono text-[#6e6e73]">arXiv:{node.arxivId}</p>
          )}
        </div>
        {node.arxivId && (
          <a
            href={`https://arxiv.org/abs/${node.arxivId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-[rgba(79,70,229,0.1)] transition-colors shrink-0"
            aria-label={`Open ${node.title} on arXiv`}
          >
            <ExternalLink size={12} className="text-[#4f46e5]" />
          </a>
        )}
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
          <ChevronRight size={14} className="text-[#6e6e73]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-black/5 space-y-3">
              <p className="text-[11px] text-[#3d3d3f] leading-relaxed">{node.whyItMatters}</p>

              <div className="rounded-xl p-3" style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <HelpCircle size={11} className="text-[#4f46e5]" />
                  <span className="text-[10px] font-mono font-semibold text-[#4f46e5] uppercase tracking-wide">Comprehension gate</span>
                </div>
                <p className="text-[11px] text-[#3d3d3f] leading-relaxed">{node.comprehensionGate}</p>
              </div>

              <div className="rounded-xl p-3" style={{ background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Wrench size={11} className="text-[#0d9488]" />
                  <span className="text-[10px] font-mono font-semibold text-[#0d9488] uppercase tracking-wide">Reimplementation task</span>
                </div>
                <p className="text-[11px] text-[#3d3d3f] leading-relaxed">{node.reimplementationTask}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CurriculumBoard() {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('researchos-learning-path');
      if (raw) setPath(JSON.parse(raw));
    } catch {
      // corrupt stored path — treat as absent
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!path || path.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(79,70,229,0.08)' }}
        >
          <Search size={20} className="text-[#4f46e5]" />
        </div>
        <p className="text-sm font-semibold text-[#1d1d1f] mb-1">No learning path yet</p>
        <p className="text-xs text-[#6e6e73] max-w-xs leading-relaxed mb-4">
          Paste an arXiv URL or ID on the Home screen and ResearchOS will build a backward-citation
          learning path for it.
        </p>
        <Link
          href="/"
          className="text-xs font-semibold text-white px-4 py-2 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
        >
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Target paper', value: path.targetTitle, icon: BookOpen, color: '#4f46e5' },
          { label: 'Steps in path', value: String(path.nodes.length), icon: ListOrdered, color: '#0d9488' },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl p-3 flex items-center gap-2.5 min-w-0"
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${stat.color}12` }}>
                <StatIcon size={14} style={{ color: stat.color } as React.CSSProperties} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1d1d1f] truncate">{stat.value}</p>
                <p className="text-[10px] font-mono text-[#6e6e73]">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {path.nodes.map((node, i) => (
          <NodeCard key={`${node.order}-${node.title}`} node={node} index={i} />
        ))}
      </div>
    </div>
  );
}
