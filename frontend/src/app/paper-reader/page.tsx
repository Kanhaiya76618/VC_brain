'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import LibraryExplorer from './components/LibraryExplorer';
import NotesPanel from '@/components/NotesPanel';
import { MOCK_PAPERS, type Paper } from '@/lib/mock/data'; // TODO(mock): no backend endpoint provides this data yet
import { ExternalLink, StickyNote, BookOpen, Users, Calendar, Hash, CheckCircle, BookMarked, Circle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const READ_STATUS_CONFIG = {
  done: { icon: CheckCircle, color: '#0d9488', label: 'Read' },
  reading: { icon: BookMarked, color: '#4f46e5', label: 'Reading' },
  unread: { icon: Circle, color: '#6e6e73', label: 'Unread' },
};

function PaperDetail({ paper }: { paper: Paper }) {
  const statusCfg = READ_STATUS_CONFIG[paper.readStatus];
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      key={paper.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-1 overflow-y-auto scrollbar-thin p-5"
    >
      {/* Paper header */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          background: `linear-gradient(135deg, ${paper.coverColor}10 0%, ${paper.coverColor}04 100%)`,
          border: `1px solid ${paper.coverColor}20`,
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
            style={{ background: `${paper.coverColor}20`, color: paper.coverColor }}
          >
            {paper.title[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-[#1d1d1f] leading-tight mb-1">{paper.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md"
                style={{
                  background: `${paper.coverColor}15`,
                  color: paper.coverColor,
                }}
              >
                {paper.difficulty}
              </span>
              <div className="flex items-center gap-1">
                <StatusIcon size={10} style={{ color: statusCfg.color } as React.CSSProperties} />
                <span className="text-[10px] font-mono" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Users, label: 'Authors', value: paper.authors.slice(0, 2).join(', ') + (paper.authors.length > 2 ? ' et al.' : '') },
            { icon: Calendar, label: 'Year', value: `${paper.venue} ${paper.year}` },
            { icon: Hash, label: 'Citations', value: paper.citationCount.toLocaleString() },
            { icon: BookOpen, label: 'arXiv', value: paper.arxivId || 'N/A' },
          ].map((meta) => {
            const Icon = meta.icon;
            return (
              <div key={meta.label} className="flex items-start gap-1.5">
                <Icon size={10} className="text-[#6e6e73] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-mono text-[#6e6e73]">{meta.label}</p>
                  <p className="text-[10px] font-semibold text-[#1d1d1f] truncate">{meta.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {paper.arxivId && (
          <a
            href={`https://arxiv.org/abs/${paper.arxivId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#4f46e5] hover:text-[#7c3aed] transition-colors"
          >
            <ExternalLink size={11} />
            View on arXiv
          </a>
        )}
      </div>

      {/* Abstract */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <p className="eyebrow mb-2">Abstract</p>
        <p className="text-xs text-[#3d3d3f] leading-relaxed">{paper.abstract}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {paper.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/5 text-[#6e6e73] border border-black/8"
          >
            #{tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function PaperReaderPage() {
  const [selectedPaper, setSelectedPaper] = useState<Paper>(MOCK_PAPERS[0]);
  const [notesOpen, setNotesOpenState] = useState(false);

  // The Dock deep-links here with #notes — read it on load and whenever it
  // changes so that link actually opens the panel instead of just landing
  // on the page.
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === '#notes') setNotesOpenState(true);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const setNotesOpen = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setNotesOpenState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      const newHash = resolved ? '#notes' : '';
      if (window.location.hash !== newHash) {
        history.replaceState(null, '', `${window.location.pathname}${newHash}`);
      }
      return resolved;
    });
  }, []);

  return (
    <AppShell topic={selectedPaper.title} agentStatus="idle">
      <div className="flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Left: Library Explorer */}
        <div
          className="w-full lg:w-80 shrink-0 p-3 lg:border-r overflow-hidden flex flex-col max-h-[42vh] lg:max-h-none border-b lg:border-b-0"
          style={{ borderColor: 'rgba(0,0,0,0.06)' }}
        >
          <LibraryExplorer onSelectPaper={setSelectedPaper} />
        </div>

        {/* Right: Paper detail */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {/* Toolbar */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-2 border-b shrink-0"
            style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.5)' }}
          >
            <p className="text-xs font-semibold text-[#1d1d1f] truncate min-w-0">{selectedPaper.title}</p>
            <button
              onClick={() => setNotesOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 shrink-0 ${
                notesOpen
                  ? 'bg-[rgba(217,119,6,0.1)] text-[#d97706] border border-[rgba(217,119,6,0.2)]'
                  : 'bg-black/5 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/8'
              }`}
              aria-label="Toggle notes panel"
            >
              <StickyNote size={12} />
              Notes
            </button>
          </div>

          <PaperDetail paper={selectedPaper} />
        </div>
      </div>

      {/* Notes panel */}
      <NotesPanel
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        paperId={selectedPaper.id}
      />
    </AppShell>
  );
}