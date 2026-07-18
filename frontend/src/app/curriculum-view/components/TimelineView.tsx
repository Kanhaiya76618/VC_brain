'use client';
import React from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';

const TIMELINE_ITEMS = [
  { id: 'tl-001', year: 2014, paperId: 'paper-003', title: 'Seq2Seq with Neural Networks', venue: 'NeurIPS', module: 'foundational' as const, status: 'read' as const },
  { id: 'tl-002', year: 2015, paperId: 'paper-002', title: 'Jointly Learning to Align and Translate', venue: 'ICLR', module: 'foundational' as const, status: 'read' as const },
  { id: 'tl-003', year: 2017, paperId: 'paper-001', title: 'Attention Is All You Need', venue: 'NeurIPS', module: 'foundational' as const, status: 'read' as const },
  { id: 'tl-004', year: 2018, paperId: 'paper-006', title: 'The Illustrated Transformer', venue: 'Blog', module: 'foundational' as const, status: 'read' as const },
  { id: 'tl-005', year: 2018, paperId: 'paper-007', title: 'Self-Attention with Relative Positions', venue: 'NAACL', module: 'foundational' as const, status: 'unread' as const },
  { id: 'tl-006', year: 2019, paperId: 'paper-005', title: 'BERT: Bidirectional Transformers', venue: 'NAACL', module: 'foundational' as const, status: 'unread' as const },
  { id: 'tl-007', year: 2020, paperId: 'paper-008', title: 'Scaling Laws for Neural Language Models', venue: 'arXiv', module: 'foundational' as const, status: 'unread' as const },
  { id: 'tl-008', year: 2020, paperId: 'paper-010', title: 'Longformer: Long-Document Transformer', venue: 'arXiv', module: 'intermediate' as const, status: 'read' as const },
  { id: 'tl-009', year: 2020, paperId: 'paper-011', title: 'Reformer: Efficient Transformer', venue: 'ICLR', module: 'intermediate' as const, status: 'unread' as const },
  { id: 'tl-010', year: 2020, paperId: 'paper-012', title: 'T5: Text-to-Text Transfer', venue: 'JMLR', module: 'intermediate' as const, status: 'unread' as const },
  { id: 'tl-011', year: 2020, paperId: 'paper-009', title: 'GPT-3: Few-Shot Learners', venue: 'NeurIPS', module: 'intermediate' as const, status: 'read' as const },
  { id: 'tl-012', year: 2021, paperId: 'paper-004', title: 'ViT: Image Worth 16x16 Words', venue: 'ICLR', module: 'foundational' as const, status: 'reading' as const },
  { id: 'tl-013', year: 2021, paperId: 'paper-014', title: 'Linear Transformers as Fast Weights', venue: 'ICML', module: 'advanced' as const, status: 'unread' as const },
  { id: 'tl-014', year: 2022, paperId: 'paper-013', title: 'FlashAttention: IO-Aware Exact Attention', venue: 'NeurIPS', module: 'advanced' as const, status: 'unread' as const },
];

const years = Array.from(new Set(TIMELINE_ITEMS.map((t) => t.year))).sort();

const moduleColors = {
  foundational: 'bg-success',
  intermediate: 'bg-amber-500',
  advanced: 'bg-red-500',
};

const statusBorderColors = {
  read: 'border-success',
  reading: 'border-primary',
  unread: 'border-border',
};

export default function TimelineView() {
  return (
    <div className="p-5">
      <div className="flex items-center gap-4 mb-6">
        <p className="text-xs font-semibold text-foreground">Reading Timeline</p>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          {(['foundational', 'intermediate', 'advanced'] as const).map((m) => (
            <span key={`legend-${m}`} className="flex items-center gap-1 text-muted-foreground capitalize">
              <span className={`w-2 h-2 rounded-full ${moduleColors[m]}`} />
              {m}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-16 top-0 bottom-0 w-px bg-border" />

        {years.map((year) => {
          const yearPapers = TIMELINE_ITEMS.filter((t) => t.year === year);
          return (
            <div key={`year-${year}`} className="relative mb-6">
              {/* Year label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-mono font-bold text-muted-foreground w-12 text-right tabular-nums">
                  {year}
                </span>
                <div className="w-3 h-3 rounded-full bg-border border-2 border-background z-10 relative ml-2.5" />
              </div>

              {/* Papers for this year */}
              <div className="ml-[72px] space-y-2">
                {yearPapers.map((item) => (
                  <div
                    key={item.id}
                    className={`group glass-panel rounded-lg px-3 py-2.5 border-l-2 ${statusBorderColors[item.status]} border border-border card-hover`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${moduleColors[item.module]}`} />
                        <Link
                          href="/paper-reader"
                          className="text-xs font-medium text-foreground hover:text-accent transition-colors truncate"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-accent">{item.venue}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href="/paper-reader" className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-accent transition-all">
                            <BookOpen size={11} />
                          </Link>
                          <button className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-accent transition-all">
                            <ExternalLink size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}