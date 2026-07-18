'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, FileText, Layers, StickyNote, FolderOpen, ArrowRight } from 'lucide-react';
import { MOCK_SEARCH_RESULTS, type SearchResult } from '@/lib/mock/data'; // TODO(mock): no backend endpoint provides this data yet
import Icon from '@/components/ui/AppIcon';


interface SpotlightSearchProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<SearchResult['type'], React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  paper: FileText,
  topic: Layers,
  note: StickyNote,
  workspace: FolderOpen,
};

const TYPE_COLORS: Record<SearchResult['type'], string> = {
  paper: '#4f46e5',
  topic: '#0d9488',
  note: '#d97706',
  workspace: '#7c3aed',
};

export default function SpotlightSearch({ open, onClose }: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? MOCK_SEARCH_RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : MOCK_SEARCH_RESULTS;

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        onClose();
      }
    },
    [filtered, selectedIndex, onClose]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] spotlight-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Search panel */}
          <motion.div
            className="fixed top-[20vh] left-1/2 z-[101] w-full max-w-xl -translate-x-1/2"
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(48px) saturate(2)',
                WebkitBackdropFilter: 'blur(48px) saturate(2)',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/6">
                <Search size={18} className="text-[#6e6e73] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search papers, topics, notes…"
                  className="flex-1 bg-transparent text-sm text-[#1d1d1f] placeholder-[#6e6e73] outline-none font-medium"
                  autoComplete="off"
                />
                <kbd className="kbd-hint">Esc</kbd>
              </div>

              {/* Results */}
              {filtered.length > 0 ? (
                <div className="py-1.5 max-h-72 overflow-y-auto scrollbar-thin">
                  {filtered.map((result, i) => {
                    const Icon = TYPE_ICONS[result.type];
                    const color = TYPE_COLORS[result.type];
                    return (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-100 ${
                          i === selectedIndex ? 'bg-[rgba(79,70,229,0.06)]' : 'hover:bg-black/4'
                        }`}
                        onMouseEnter={() => setSelectedIndex(i)}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${color}15`, border: `1px solid ${color}20` }}
                        >
                          <Icon size={13} style={{ color } as React.CSSProperties} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1d1d1f] truncate">{result.title}</p>
                          <p className="text-[11px] text-[#6e6e73] font-mono truncate">{result.subtitle}</p>
                        </div>
                        {i === selectedIndex && (
                          <ArrowRight size={13} className="text-[#4f46e5] shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#6e6e73]">No results for "{query}"</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-black/6 bg-black/2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-[#6e6e73]">
                    <kbd className="kbd-hint">↑↓</kbd> navigate
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#6e6e73]">
                    <kbd className="kbd-hint">↵</kbd> open
                  </span>
                </div>
                <span className="text-[10px] text-[#6e6e73] font-mono">{filtered.length} results</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
