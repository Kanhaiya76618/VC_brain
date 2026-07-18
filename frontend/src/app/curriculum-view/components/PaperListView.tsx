'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink, Star, CheckCircle, Circle, Quote, SortAsc } from 'lucide-react';

interface PaperListViewProps {
  activeModule: string;
}

const ALL_PAPERS = [
  {
    id: 'paper-001',
    module: 'module-foundational',
    title: 'Attention Is All You Need',
    authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.', 'Uszkoreit, J.'],
    venue: 'NeurIPS',
    year: 2017,
    arxivId: '1706.03762',
    citations: 98421,
    difficulty: 'foundational' as const,
    status: 'read' as const,
    tags: ['Transformer', 'Self-Attention', 'Architecture'],
    critique: null,
    rationale: 'Foundational paper introducing the Transformer architecture and multi-head attention.',
    readingTime: 45,
  },
  {
    id: 'paper-002',
    module: 'module-foundational',
    title: 'Neural Machine Translation by Jointly Learning to Align and Translate',
    authors: ['Bahdanau, D.', 'Cho, K.', 'Bengio, Y.'],
    venue: 'ICLR',
    year: 2015,
    arxivId: '1409.0473',
    citations: 21847,
    difficulty: 'foundational' as const,
    status: 'read' as const,
    tags: ['Attention', 'NMT', 'Seq2Seq'],
    critique: null,
    rationale: 'First attention mechanism for NMT — prerequisite for understanding Transformer attention.',
    readingTime: 35,
  },
  {
    id: 'paper-003',
    module: 'module-foundational',
    title: 'Sequence to Sequence Learning with Neural Networks',
    authors: ['Sutskever, I.', 'Vinyals, O.', 'Le, Q. V.'],
    venue: 'NeurIPS',
    year: 2014,
    arxivId: '1409.3215',
    citations: 18392,
    difficulty: 'foundational' as const,
    status: 'read' as const,
    tags: ['Seq2Seq', 'Encoder-Decoder', 'LSTM'],
    critique: 'outdated' as const,
    rationale: 'Establishes the encoder-decoder framework that attention mechanisms were designed to improve.',
    readingTime: 30,
  },
  {
    id: 'paper-004',
    module: 'module-foundational',
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
    authors: ['Dosovitskiy, A.', 'Beyer, L.', 'Kolesnikov, A.'],
    venue: 'ICLR',
    year: 2021,
    arxivId: '2010.11929',
    citations: 34218,
    difficulty: 'foundational' as const,
    status: 'reading' as const,
    tags: ['ViT', 'Vision', 'Patches'],
    critique: null,
    rationale: 'Demonstrates that self-attention scales effectively to vision tasks — broadens scope.',
    readingTime: 40,
  },
  {
    id: 'paper-005',
    module: 'module-foundational',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Devlin, J.', 'Chang, M.-W.', 'Lee, K.', 'Toutanova, K.'],
    venue: 'NAACL',
    year: 2019,
    arxivId: '1810.04805',
    citations: 61243,
    difficulty: 'foundational' as const,
    status: 'unread' as const,
    tags: ['BERT', 'Pretraining', 'Bidirectional'],
    critique: null,
    rationale: 'Establishes masked language modeling as a pretraining objective — critical for modern NLP.',
    readingTime: 50,
  },
  {
    id: 'paper-006',
    module: 'module-foundational',
    title: 'The Illustrated Transformer (Annotated)',
    authors: ['Alammar, J.'],
    venue: 'Blog / ArXiv',
    year: 2018,
    arxivId: 'N/A',
    citations: 0,
    difficulty: 'foundational' as const,
    status: 'read' as const,
    tags: ['Tutorial', 'Visualization'],
    critique: null,
    rationale: 'Intuition-building resource — recommended before tackling the original paper.',
    readingTime: 20,
  },
  {
    id: 'paper-007',
    module: 'module-foundational',
    title: 'Self-Attention with Relative Position Representations',
    authors: ['Shaw, P.', 'Uszkoreit, J.', 'Vaswani, A.'],
    venue: 'NAACL',
    year: 2018,
    arxivId: '1803.02155',
    citations: 4821,
    difficulty: 'foundational' as const,
    status: 'unread' as const,
    tags: ['Positional Encoding', 'Relative Positions'],
    critique: 'gap' as const,
    rationale: 'Explains how position information is encoded — gap in curriculum if skipped.',
    readingTime: 25,
  },
  {
    id: 'paper-008',
    module: 'module-foundational',
    title: 'Scaling Laws for Neural Language Models',
    authors: ['Kaplan, J.', 'McCandlish, S.', 'Henighan, T.'],
    venue: 'arXiv',
    year: 2020,
    arxivId: '2001.08361',
    citations: 9847,
    difficulty: 'foundational' as const,
    status: 'unread' as const,
    tags: ['Scaling', 'Compute', 'Data'],
    critique: null,
    rationale: 'Sets the empirical foundation for understanding how transformers scale.',
    readingTime: 55,
  },
  // Intermediate
  {
    id: 'paper-009',
    module: 'module-intermediate',
    title: 'GPT-3: Language Models are Few-Shot Learners',
    authors: ['Brown, T.', 'Mann, B.', 'Ryder, N.'],
    venue: 'NeurIPS',
    year: 2020,
    arxivId: '2005.14165',
    citations: 28941,
    difficulty: 'intermediate' as const,
    status: 'read' as const,
    tags: ['GPT', 'Few-Shot', 'In-Context Learning'],
    critique: 'contradiction' as const,
    rationale: 'Demonstrates emergent few-shot capabilities from scale — key intermediate milestone.',
    readingTime: 60,
  },
  {
    id: 'paper-010',
    module: 'module-intermediate',
    title: 'Longformer: The Long-Document Transformer',
    authors: ['Beltagy, I.', 'Peters, M. E.', 'Cohan, A.'],
    venue: 'arXiv',
    year: 2020,
    arxivId: '2004.05150',
    citations: 6214,
    difficulty: 'intermediate' as const,
    status: 'read' as const,
    tags: ['Long Context', 'Efficient Attention', 'Sliding Window'],
    critique: null,
    rationale: 'First efficient attention variant for long documents — introduces sparse attention patterns.',
    readingTime: 45,
  },
  {
    id: 'paper-011',
    module: 'module-intermediate',
    title: 'Reformer: The Efficient Transformer',
    authors: ['Kitaev, N.', 'Kaiser, Ł.', 'Levskaya, A.'],
    venue: 'ICLR',
    year: 2020,
    arxivId: '2001.04451',
    citations: 3892,
    difficulty: 'intermediate' as const,
    status: 'unread' as const,
    tags: ['Locality-Sensitive Hashing', 'Memory Efficiency'],
    critique: null,
    rationale: 'Introduces LSH attention — important for understanding memory-efficient transformers.',
    readingTime: 40,
  },
  {
    id: 'paper-012',
    module: 'module-intermediate',
    title: 'T5: Exploring the Limits of Transfer Learning with Text-to-Text',
    authors: ['Raffel, C.', 'Shazeer, N.', 'Roberts, A.'],
    venue: 'JMLR',
    year: 2020,
    arxivId: '1910.10683',
    citations: 18742,
    difficulty: 'intermediate' as const,
    status: 'unread' as const,
    tags: ['Transfer Learning', 'Text-to-Text', 'Pretraining'],
    critique: null,
    rationale: 'Unifies NLP tasks in a text-to-text framework — defines modern pretraining paradigms.',
    readingTime: 70,
  },
  // Advanced
  {
    id: 'paper-013',
    module: 'module-advanced',
    title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
    authors: ['Dao, T.', 'Fu, D. Y.', 'Ermon, S.', 'Rudra, A.', 'Ré, C.'],
    venue: 'NeurIPS',
    year: 2022,
    arxivId: '2205.14135',
    citations: 4821,
    difficulty: 'advanced' as const,
    status: 'unread' as const,
    tags: ['IO-Awareness', 'CUDA', 'Memory'],
    critique: null,
    rationale: 'State-of-the-art exact attention implementation — critical for understanding production systems.',
    readingTime: 55,
  },
  {
    id: 'paper-014',
    module: 'module-advanced',
    title: 'Linear Transformers Are Secretly Fast Weight Programmers',
    authors: ['Schlag, I.', 'Irie, K.', 'Schmidhuber, J.'],
    venue: 'ICML',
    year: 2021,
    arxivId: '2102.11174',
    citations: 892,
    difficulty: 'advanced' as const,
    status: 'unread' as const,
    tags: ['Linear Attention', 'Fast Weights', 'Theory'],
    critique: 'gap' as const,
    rationale: 'Connects linear attention to fast weight programmers — fills a theoretical gap.',
    readingTime: 50,
  },
];

const difficultyStyles = {
  foundational: 'difficulty-foundational',
  intermediate: 'difficulty-intermediate',
  advanced: 'difficulty-advanced',
};

const critiqueConfig = {
  gap: { label: 'Gap', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  contradiction: { label: 'Contradiction', className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  outdated: { label: 'Outdated', className: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
};

const statusIcons = {
  read: <CheckCircle size={14} className="text-success" />,
  reading: <BookOpen size={14} className="text-primary" />,
  unread: <Circle size={14} className="text-muted-foreground" />,
};

export default function PaperListView({ activeModule }: PaperListViewProps) {
  const [sortBy, setSortBy] = useState<'order' | 'citations' | 'year'>('order');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');

  const papers = ALL_PAPERS.filter((p) => p.module === activeModule);
  const filtered = papers.filter((p) => filterStatus === 'all' || p.status === filterStatus);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'citations') return b.citations - a.citations;
    if (sortBy === 'year') return b.year - a.year;
    return 0;
  });

  return (
    <div className="p-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={`filter-${f}`}
                onClick={() => setFilterStatus(f)}
                className={`px-2.5 py-1 rounded-md text-xs capitalize transition-all duration-150 ${
                  filterStatus === f
                    ? 'bg-primary/15 text-accent font-medium' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {sorted.length} papers
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <SortAsc size={13} className="text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs bg-muted/30 border border-border rounded-md px-2 py-1 text-muted-foreground focus:outline-none focus:border-primary/40"
          >
            <option value="order">Curriculum order</option>
            <option value="citations">Most cited</option>
            <option value="year">Most recent</option>
          </select>
        </div>
      </div>

      {/* Paper cards */}
      <div className="space-y-2">
        {sorted.map((paper, idx) => (
          <div
            key={paper.id}
            className="group glass-panel rounded-xl p-4 border border-border card-hover"
          >
            <div className="flex items-start gap-3">
              {/* Index */}
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-5 shrink-0 mt-0.5">
                {(idx + 1).toString().padStart(2, '0')}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <Link
                    href="/paper-reader"
                    className="text-sm font-semibold text-foreground hover:text-accent transition-colors leading-tight line-clamp-2 flex-1"
                  >
                    {paper.title}
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {paper.critique && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${critiqueConfig[paper.critique].className}`}>
                        {critiqueConfig[paper.critique].label}
                      </span>
                    )}
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${difficultyStyles[paper.difficulty]}`}>
                      {paper.difficulty}
                    </span>
                  </div>
                </div>

                {/* Authors + meta */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">·</span>
                  <span className="text-[11px] font-mono text-accent">{paper.venue}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">·</span>
                  <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{paper.year}</span>
                  {paper.arxivId !== 'N/A' && (
                    <>
                      <span className="text-[11px] font-mono text-muted-foreground">·</span>
                      <span className="text-[11px] font-mono text-muted-foreground">arXiv:{paper.arxivId}</span>
                    </>
                  )}
                </div>

                {/* Rationale */}
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">
                  {paper.rationale}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {paper.tags.map((tag) => (
                    <span key={`tag-${paper.id}-${tag}`} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right stats */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  {statusIcons[paper.status]}
                </div>
                {paper.citations > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <Quote size={10} />
                    <span className="tabular-nums">{paper.citations.toLocaleString()}</span>
                  </div>
                )}
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                  ~{paper.readingTime}m
                </span>
                {/* Hover actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href="/paper-reader"
                    className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-accent transition-all"
                    title="Open reader"
                  >
                    <BookOpen size={13} />
                  </Link>
                  <button className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-accent transition-all" title="Open on arXiv">
                    <ExternalLink size={13} />
                  </button>
                  <button className="p-1 rounded hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-all" title="Bookmark">
                    <Star size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}