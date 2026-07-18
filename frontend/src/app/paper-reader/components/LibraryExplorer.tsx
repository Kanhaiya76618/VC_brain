'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, List, ChevronLeft, ChevronRight, Search, ExternalLink, CheckCircle, BookMarked, Circle } from 'lucide-react';
import { MOCK_PAPERS, type Paper } from '@/lib/mock/data'; // TODO(mock): no backend endpoint provides this data yet

const DIFFICULTY_STYLES: Record<string, { bg: string; color: string }> = {
  foundational: { bg: 'rgba(13,148,136,0.1)', color: '#0d9488' },
  intermediate: { bg: 'rgba(217,119,6,0.1)', color: '#d97706' },
  advanced: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626' },
};

const READ_STATUS_ICONS: Record<string, React.ReactNode> = {
  done: <CheckCircle size={12} className="text-[#0d9488]" />,
  reading: <BookMarked size={12} className="text-[#4f46e5]" />,
  unread: <Circle size={12} className="text-[#6e6e73]" />,
};

// CoverFlow component
function CoverFlow({ papers, onSelect }: { papers: Paper[]; onSelect: (p: Paper) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setActiveIndex((i) => Math.min(papers.length - 1, i + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative flex flex-col items-center py-6">
      {/* Cards */}
      <div className="relative flex items-center justify-center h-52 w-full overflow-hidden">
        {papers.map((paper, i) => {
          const offset = i - activeIndex;
          const isActive = offset === 0;
          const absOffset = Math.abs(offset);
          const visible = absOffset <= 2;

          if (!visible) return null;

          const rotateY = offset * 45;
          const translateX = offset * 140;
          const translateZ = isActive ? 0 : -80 - absOffset * 20;
          const opacity = isActive ? 1 : Math.max(0, 1 - absOffset * 0.35);
          const scale = isActive ? 1 : 0.85 - absOffset * 0.05;

          return (
            <motion.div
              key={paper.id}
              className="absolute cursor-pointer"
              style={{
                width: 120,
                height: 160,
                zIndex: 10 - absOffset,
              }}
              animate={{
                rotateY,
                x: translateX,
                z: translateZ,
                opacity,
                scale,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => isActive ? onSelect(paper) : setActiveIndex(i)}
              whileHover={isActive ? { scale: 1.05 } : {}}
            >
              <div
                className="w-full h-full rounded-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${paper.coverColor}20 0%, ${paper.coverColor}08 100%)`,
                  border: isActive ? `2px solid ${paper.coverColor}40` : '1px solid rgba(255,255,255,0.6)',
                  boxShadow: isActive
                    ? `0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px ${paper.coverColor}20`
                    : '0 4px 16px rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                {/* Cover art */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold mb-2"
                  style={{ background: `${paper.coverColor}20`, color: paper.coverColor }}
                >
                  {paper.title[0]}
                </div>
                <p className="text-[9px] font-semibold text-[#1d1d1f] text-center line-clamp-3 leading-tight">
                  {paper.title}
                </p>
                <p className="text-[8px] font-mono text-[#6e6e73] mt-1">{paper.year}</p>

                {/* Reflection */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-2xl"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15))',
                    transform: 'scaleY(-1)',
                    opacity: 0.4,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Reflection line */}
      <div className="w-64 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mt-2 mb-4" />

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="p-2 rounded-xl bg-white/70 border border-black/8 text-[#6e6e73] hover:text-[#1d1d1f] disabled:opacity-30 transition-all"
          aria-label="Previous paper"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[11px] font-mono text-[#6e6e73]">
          {activeIndex + 1} / {papers.length}
        </span>
        <button
          onClick={handleNext}
          disabled={activeIndex === papers.length - 1}
          className="p-2 rounded-xl bg-white/70 border border-black/8 text-[#6e6e73] hover:text-[#1d1d1f] disabled:opacity-30 transition-all"
          aria-label="Next paper"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Active paper title */}
      <p className="text-xs font-semibold text-[#1d1d1f] mt-3 text-center max-w-xs">
        {papers[activeIndex]?.title}
      </p>
      <p className="text-[10px] font-mono text-[#6e6e73] mt-0.5">
        {papers[activeIndex]?.authors[0]} · {papers[activeIndex]?.venue} {papers[activeIndex]?.year}
      </p>
    </div>
  );
}

// Need to import useEffect
import { useEffect } from 'react';

export default function LibraryExplorer({ onSelectPaper }: { onSelectPaper?: (p: Paper) => void }) {
  const [viewMode, setViewMode] = useState<'coverflow' | 'grid' | 'list'>('coverflow');
  const [filter, setFilter] = useState('');
  const [breadcrumb] = useState(['Attention Mechanisms', 'Module 1', 'Papers']);

  const filtered = filter
    ? MOCK_PAPERS.filter(
        (p) =>
          p.title.toLowerCase().includes(filter.toLowerCase()) ||
          p.authors.some((a) => a.toLowerCase().includes(filter.toLowerCase()))
      )
    : MOCK_PAPERS;

  return (
    <div
      className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      {/* Toolbar */}
      <div className="border-b border-black/6">
        {/* Breadcrumb — own row, truncates safely instead of colliding with controls below */}
        <div className="flex items-center gap-1 px-4 pt-2.5 overflow-hidden">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={crumb}>
              <span
                className={`text-[11px] font-mono whitespace-nowrap ${
                  i === breadcrumb.length - 1 ? 'text-[#1d1d1f] font-semibold shrink-0' : 'text-[#6e6e73] truncate min-w-0'
                }`}
              >
                {crumb}
              </span>
              {i < breadcrumb.length - 1 && <ChevronRight size={10} className="text-[#6e6e73] shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Controls — own row, filter grows, view switcher stays fixed-size */}
        <div className="flex items-center gap-2 px-4 py-2">
          {/* Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 border border-black/8 flex-1 min-w-0">
            <Search size={11} className="text-[#6e6e73] shrink-0" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter papers…"
              aria-label="Filter papers"
              className="bg-transparent text-[11px] text-[#1d1d1f] placeholder-[#6e6e73] outline-none w-full min-w-0"
            />
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/5 shrink-0">
            {[
              { id: 'coverflow' as const, icon: '⊞', label: 'Cover Flow' },
              { id: 'grid' as const, icon: Grid, label: 'Grid' },
              { id: 'list' as const, icon: List, label: 'List' },
            ].map((v) => {
              const active = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className={`p-1.5 rounded-md transition-all duration-150 ${active ? 'bg-white shadow-sm text-[#4f46e5]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                  aria-label={v.label}
                >
                  {typeof v.icon === 'string' ? (
                    <span className="text-xs">{v.icon}</span>
                  ) : (
                    <v.icon size={12} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {viewMode === 'coverflow' && (
            <motion.div
              key="coverflow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CoverFlow papers={filtered} onSelect={(p) => onSelectPaper?.(p)} />
            </motion.div>
          )}

          {viewMode === 'grid' && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4"
            >
              {filtered.map((paper, i) => {
                const diff = DIFFICULTY_STYLES[paper.difficulty];
                return (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="rounded-xl p-3 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${paper.coverColor}10 0%, ${paper.coverColor}04 100%)`,
                      border: `1px solid ${paper.coverColor}20`,
                    }}
                    onClick={() => onSelectPaper?.(paper)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      {READ_STATUS_ICONS[paper.readStatus]}
                      <span
                        className="text-[8px] font-mono font-semibold px-1 py-0.5 rounded"
                        style={{ background: diff.bg, color: diff.color }}
                      >
                        {paper.difficulty}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-[#1d1d1f] line-clamp-3 leading-tight mb-1">
                      {paper.title}
                    </p>
                    <p className="text-[9px] font-mono text-[#6e6e73]">{paper.year}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="divide-y divide-black/5"
            >
              {filtered.map((paper, i) => {
                const diff = DIFFICULTY_STYLES[paper.difficulty];
                return (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-black/3 cursor-pointer transition-colors"
                    onClick={() => onSelectPaper?.(paper)}
                  >
                    <div className="mt-0.5">{READ_STATUS_ICONS[paper.readStatus]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1d1d1f] truncate">{paper.title}</p>
                      <p className="text-[10px] font-mono text-[#6e6e73]">
                        {paper.authors[0]} · {paper.venue} {paper.year} · {paper.citationCount.toLocaleString()} citations
                      </p>
                    </div>
                    <span
                      className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                      style={{ background: diff.bg, color: diff.color }}
                    >
                      {paper.difficulty}
                    </span>
                    {paper.arxivId && (
                      <a
                        href={`https://arxiv.org/abs/${paper.arxivId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg hover:bg-[rgba(79,70,229,0.1)] transition-colors"
                        aria-label={`Open ${paper.title} on arXiv`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={11} className="text-[#4f46e5]" />
                      </a>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
