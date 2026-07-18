'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  FileText, GitBranch, MessageSquare, Save, CheckCircle,
  AlertTriangle, XCircle, Clock, X, ChevronRight
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type Tab = 'notes' | 'related' | 'critique';

interface PaperSidePanelProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const RELATED_PAPERS = [
  {
    id: 'rel-001',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: 'Devlin et al.',
    year: 2019,
    relation: 'builds-on' as const,
    citations: 61243,
  },
  {
    id: 'rel-002',
    title: 'Neural Machine Translation by Jointly Learning to Align',
    authors: 'Bahdanau et al.',
    year: 2015,
    relation: 'cites' as const,
    citations: 21847,
  },
  {
    id: 'rel-003',
    title: 'FlashAttention: Fast and Memory-Efficient Exact Attention',
    authors: 'Dao et al.',
    year: 2022,
    relation: 'builds-on' as const,
    citations: 4821,
  },
  {
    id: 'rel-004',
    title: 'Longformer: The Long-Document Transformer',
    authors: 'Beltagy et al.',
    year: 2020,
    relation: 'builds-on' as const,
    citations: 6214,
  },
  {
    id: 'rel-005',
    title: 'Are Emergent Abilities of LLMs a Mirage?',
    authors: 'Schaeffer et al.',
    year: 2023,
    relation: 'contradicts' as const,
    citations: 892,
  },
  {
    id: 'rel-006',
    title: 'Scaling Laws for Neural Language Models',
    authors: 'Kaplan et al.',
    year: 2020,
    relation: 'cites' as const,
    citations: 9847,
  },
  {
    id: 'rel-007',
    title: 'Sequence to Sequence Learning with Neural Networks',
    authors: 'Sutskever et al.',
    year: 2014,
    relation: 'cites' as const,
    citations: 18392,
  },
];

const PAPER_CRITIQUES = [
  {
    id: 'pc-001',
    type: 'gap' as const,
    title: 'Missing: Relative positional encodings',
    description: 'Section 3 covers only sinusoidal positional encoding. RoPE and ALiBi are now standard and should be noted as extensions.',
    dismissed: false,
  },
  {
    id: 'pc-002',
    type: 'outdated' as const,
    title: 'BLEU results superseded',
    description: 'The WMT 2014 BLEU scores in Section 4 are now historical benchmarks — subsequent models have surpassed them significantly.',
    dismissed: false,
  },
];

const relationConfig = {
  'builds-on': { label: 'builds-on', className: 'bg-primary/15 text-accent border-primary/20' },
  cites: { label: 'cites', className: 'bg-muted/50 text-muted-foreground border-border' },
  contradicts: { label: 'contradicts', className: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

const critiqueTypeConfig = {
  gap: { icon: AlertTriangle, color: 'text-amber-400', bg: 'critique-gap' },
  contradiction: { icon: XCircle, color: 'text-red-400', bg: 'critique-contradiction' },
  outdated: { icon: Clock, color: 'text-slate-400', bg: 'critique-outdated' },
};

export default function PaperSidePanel({ activeTab, onTabChange }: PaperSidePanelProps) {
  const [notes, setNotes] = useState(
    `## Reading Notes — Attention Is All You Need\n\n### Key Insights\n- Eliminates recurrence entirely — enables full parallelization\n- Multi-head attention allows attending to multiple representation subspaces\n- Positional encoding via sinusoidal functions — no learned positions\n\n### Questions\n- Why √d_k scaling? (Prevents vanishing gradients in softmax)\n- How does encoder-decoder attention differ from self-attention?\n\n### Follow-up papers\n- [ ] BERT (Devlin 2019) — bidirectional pretraining\n- [ ] FlashAttention (Dao 2022) — efficient implementation`
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [paperCritiques, setPaperCritiques] = useState(PAPER_CRITIQUES);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      // TODO: persist notes to backend / local storage
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const dismissCritique = (id: string) => {
    setPaperCritiques((prev) => prev.map((c) => (c.id === id ? { ...c, dismissed: true } : c)));
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'related', label: 'Related', icon: GitBranch, badge: RELATED_PAPERS.length },
    { id: 'critique', label: 'Critique', icon: MessageSquare, badge: paperCritiques.filter((c) => !c.dismissed).length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
                isActive ? 'tab-active' : 'tab-inactive hover:text-foreground'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[9px] font-mono px-1 py-0.5 rounded-full ${
                  isActive ? 'bg-primary/20 text-accent' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Notes tab */}
        {activeTab === 'notes' && (
          <div className="flex flex-col h-full p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Personal notes
              </p>
              <div className="flex items-center gap-1">
                {saveStatus === 'saving' && (
                  <span className="text-[10px] font-mono text-muted-foreground animate-pulse">
                    Saving…
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-success">
                    <CheckCircle size={10} />
                    Saved
                  </span>
                )}
                <Save size={11} className="text-muted-foreground" />
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="flex-1 w-full bg-muted/20 border border-border rounded-lg p-3 text-xs font-mono text-foreground resize-none focus:outline-none focus:border-primary/40 leading-relaxed scrollbar-thin"
              placeholder="Start taking notes… Markdown supported."
              spellCheck={false}
            />
            <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
              <span>Markdown supported</span>
              <span className="tabular-nums">{notes.length} chars</span>
            </div>
          </div>
        )}

        {/* Related tab */}
        {activeTab === 'related' && (
          <div className="p-3">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Semantically related · {RELATED_PAPERS.length} papers
            </p>
            <div className="space-y-2">
              {RELATED_PAPERS.map((paper) => {
                const relCfg = relationConfig[paper.relation];
                return (
                  <div
                    key={paper.id}
                    className="group glass-panel rounded-lg p-3 border border-border card-hover"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Link
                        href="/paper-reader"
                        className="text-[11px] font-semibold text-foreground hover:text-accent transition-colors leading-tight line-clamp-2 flex-1"
                      >
                        {paper.title}
                      </Link>
                      <ChevronRight size={11} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-muted-foreground">{paper.authors}</span>
                      <span className="text-[10px] font-mono text-muted-foreground tabular-nums">·{paper.year}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${relCfg.className}`}>
                        {relCfg.label}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1 tabular-nums">
                      {paper.citations.toLocaleString()} citations
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Critique tab */}
        {activeTab === 'critique' && (
          <div className="p-3">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Paper-level critique · {paperCritiques.filter((c) => !c.dismissed).length} active
            </p>
            <div className="space-y-2">
              {paperCritiques.filter((c) => !c.dismissed).map((critique) => {
                const cfg = critiqueTypeConfig[critique.type];
                const Icon = cfg.icon;
                return (
                  <div key={critique.id} className={`rounded-lg p-3 ${cfg.bg}`}>
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div className="flex items-start gap-1.5">
                        <Icon size={12} className={`${cfg.color} shrink-0 mt-0.5`} />
                        <p className="text-[11px] font-semibold text-foreground leading-tight">
                          {critique.title}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissCritique(critique.id)}
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        aria-label="Dismiss"
                      >
                        <X size={11} />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {critique.description}
                    </p>
                  </div>
                );
              })}
              {paperCritiques.every((c) => c.dismissed) && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle size={24} className="text-success mb-2" />
                  <p className="text-xs font-semibold text-foreground mb-1">All critiques resolved</p>
                  <p className="text-[11px] text-muted-foreground">This paper has been fully reviewed.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}