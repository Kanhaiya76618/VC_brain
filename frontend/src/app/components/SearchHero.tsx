'use client';
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Sparkles, Command, AlertTriangle } from 'lucide-react';
import PipelineLoader from '@/components/PipelineLoader';
import { generateCurriculum } from '@/lib/api';
import { getStudentId } from '@/lib/studentId';

const ARXIV_SUGGESTIONS = [
  { id: '1706.03762', title: 'Attention Is All You Need' },
  { id: '1810.04805', title: 'BERT: Pre-training of Deep Bidirectional Transformers' },
  { id: '2005.14165', title: 'Language Models are Few-Shot Learners (GPT-3)' },
  { id: '2203.02155', title: 'Training language models to follow instructions (InstructGPT)' },
  { id: '2005.11401', title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP' },
];

type PipelineState = 'idle' | 'running' | 'done';

export default function SearchHero() {
  const [query, setQuery] = useState('');
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filteredSuggestions = query.length > 1
    ? ARXIV_SUGGESTIONS.filter(
        (s) => s.id.includes(query) || s.title.toLowerCase().includes(query.toLowerCase())
      )
    : ARXIV_SUGGESTIONS;

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || pipelineState === 'running') return;
    setShowSuggestions(false);
    setError(null);
    setPipelineState('running');
    try {
      const path = await generateCurriculum(query.trim(), getStudentId());
      sessionStorage.setItem('researchos-learning-path', JSON.stringify(path));
      setPipelineState('done');
      setTimeout(() => router.push('/curriculum-view'), 600);
    } catch (err) {
      setPipelineState('idle');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [query, pipelineState, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col items-center pt-8 pb-10">
      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full"
        style={{
          background: 'rgba(79,70,229,0.08)',
          border: '1px solid rgba(79,70,229,0.15)',
        }}
      >
        <Sparkles size={11} className="text-[#4f46e5]" />
        <span className="text-[11px] font-mono font-semibold text-[#4f46e5] tracking-wide">
          AI Research Pipeline · backward-citation curriculum
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }}
        className="text-4xl lg:text-5xl xl:text-6xl font-bold text-center leading-tight mb-3"
        style={{ letterSpacing: '-0.02em' }}
      >
        <span className="text-[#1d1d1f]">Map any research paper</span>
        <br />
        <span className="text-gradient-primary">in minutes, not months.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-sm text-[#6e6e73] text-center max-w-xl mb-8 leading-relaxed"
      >
        Paste an arXiv URL or ID. ResearchOS reads the paper&apos;s citations and builds the
        backward learning path you need to understand it — with comprehension gates and
        reimplementation tasks per step.
      </motion.p>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        className="relative w-full max-w-2xl"
      >
        <div
          className="relative rounded-2xl search-glow transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.95)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
          }}
        >
          <div className="flex items-center gap-3 px-5 py-4">
            <Search size={18} className="text-[#6e6e73] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={handleKeyDown}
              placeholder="arXiv URL or ID — e.g. 1706.03762 or arxiv.org/abs/1706.03762"
              aria-label="arXiv URL or ID"
              className="flex-1 bg-transparent text-sm text-[#1d1d1f] placeholder-[#6e6e73] outline-none font-medium"
              autoComplete="off"
              disabled={pipelineState === 'running'}
            />
            <div className="flex items-center gap-2 shrink-0">
              <span className="kbd-hint hidden sm:flex items-center gap-0.5">
                <Command size={9} />K
              </span>
              <motion.button
                onClick={handleSubmit}
                disabled={!query.trim() || pipelineState === 'running'}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>{pipelineState === 'running' ? 'Building…' : 'Build Path'}</span>
                <ArrowRight size={13} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="flex items-start gap-2 mt-3 px-4 py-3 rounded-xl"
              style={{
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.2)',
              }}
            >
              <AlertTriangle size={13} className="text-[#dc2626] shrink-0 mt-0.5" />
              <p className="text-xs text-[#dc2626] leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && pipelineState === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute left-0 right-0 top-full mt-2 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              }}
            >
              <div className="px-4 py-2 border-b border-black/6">
                <p className="eyebrow">Try a well-known paper</p>
              </div>
              {filteredSuggestions.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onMouseDown={() => { setQuery(s.id); setShowSuggestions(false); setTimeout(() => inputRef.current?.focus(), 0); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1d1d1f] hover:bg-[rgba(79,70,229,0.05)] transition-colors duration-100 text-left"
                >
                  <Sparkles size={12} className="text-[#4f46e5] shrink-0" />
                  <span className="font-mono text-xs text-[#6e6e73] shrink-0">{s.id}</span>
                  <span className="truncate">{s.title}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pipeline loader */}
      <AnimatePresence>
        {pipelineState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-2xl mt-5"
          >
            <PipelineLoader state={pipelineState} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
