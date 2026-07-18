'use client';
import React, { useState } from 'react';
import { X, ChevronRight, AlertTriangle, XCircle, Clock, CheckCheck, MessageSquare, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


interface CritiqueSidebarProps {
  onClose: () => void;
}

interface CritiqueCard {
  id: string;
  type: 'gap' | 'contradiction' | 'outdated';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  paperId?: string;
  paperTitle?: string;
  suggestion: string;
  dismissed: boolean;
}

const INITIAL_CRITIQUES: CritiqueCard[] = [
  {
    id: 'crit-001',
    type: 'gap',
    severity: 'high',
    title: 'Missing: Relative positional encodings',
    description: 'The curriculum covers absolute positional encoding (original Transformer) but does not include RoPE, ALiBi, or relative position methods used in modern LLMs.',
    paperId: 'paper-007',
    paperTitle: 'Self-Attention with Relative Positions',
    suggestion: 'Add "RoFormer: Enhanced Transformer with Rotary Position Embedding" (Su et al., 2021) to Intermediate module.',
    dismissed: false,
  },
  {
    id: 'crit-002',
    type: 'contradiction',
    severity: 'high',
    title: 'Contradicted claim in GPT-3 rationale',
    description: 'The curriculum claims GPT-3 demonstrates "emergent capabilities at scale" but Schaeffer et al. (2023) argues these emerge from metric choice, not model capability.',
    paperId: 'paper-009',
    paperTitle: 'GPT-3: Few-Shot Learners',
    suggestion: 'Add "Are Emergent Abilities of Large Language Models a Mirage?" (Schaeffer 2023) as a counter-evidence paper.',
    dismissed: false,
  },
  {
    id: 'crit-003',
    type: 'outdated',
    severity: 'medium',
    title: 'Seq2Seq paper citation is historical only',
    description: 'Sutskever et al. (2014) is cited as motivation but modern readers should understand that LSTM-based Seq2Seq has been entirely superseded.',
    paperId: 'paper-003',
    paperTitle: 'Seq2Seq with Neural Networks',
    suggestion: 'Add a note in the rationale: "Read for historical context — architecture is superseded by Transformers."',
    dismissed: false,
  },
  {
    id: 'crit-004',
    type: 'gap',
    severity: 'medium',
    title: 'Missing: Sparse attention survey',
    description: 'Multiple efficient attention papers (Longformer, Reformer, BigBird) are listed but no survey paper synthesizes the trade-offs between them.',
    paperId: undefined,
    paperTitle: undefined,
    suggestion: 'Add "Efficient Transformers: A Survey" (Tay et al., 2022) as a capstone for the Intermediate module.',
    dismissed: false,
  },
  {
    id: 'crit-005',
    type: 'gap',
    severity: 'low',
    title: 'No coverage of mixture-of-experts attention',
    description: 'The curriculum covers dense attention but misses sparse MoE routing which is central to models like Mixtral and GPT-4.',
    paperId: undefined,
    paperTitle: undefined,
    suggestion: 'Add "Switch Transformers" (Fedus et al., 2021) to Advanced module as stretch reading.',
    dismissed: false,
  },
  {
    id: 'crit-006',
    type: 'outdated',
    severity: 'medium',
    title: 'FlashAttention v1 only — v2/v3 exist',
    description: 'The curriculum includes FlashAttention (2022) but FlashAttentionv2 (2023) and v3 (2024) offer significant throughput improvements.',
    paperId: 'paper-013',
    paperTitle: 'FlashAttention',
    suggestion: 'Update curriculum to reference FlashAttention-2 (Dao, 2023) as the canonical implementation.',
    dismissed: false,
  },
  {
    id: 'crit-007',
    type: 'contradiction',
    severity: 'low',
    title: 'Scaling Laws vs. Chinchilla trade-off',
    description: 'Kaplan et al. (2020) scaling laws are included but the Chinchilla paper (Hoffmann 2022) significantly revises compute-optimal training recommendations.',
    paperId: 'paper-008',
    paperTitle: 'Scaling Laws for Neural Language Models',
    suggestion: 'Add "Training Compute-Optimal Large Language Models" (Hoffmann et al., 2022) as a direct follow-up.',
    dismissed: false,
  },
];

const typeConfig = {
  gap: {
    icon: AlertTriangle,
    label: 'Gap',
    className: 'critique-gap',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    iconColor: 'text-amber-400',
  },
  contradiction: {
    icon: XCircle,
    label: 'Contradiction',
    className: 'critique-contradiction',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/20',
    iconColor: 'text-red-400',
  },
  outdated: {
    icon: Clock,
    label: 'Outdated',
    className: 'critique-outdated',
    badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    iconColor: 'text-slate-400',
  },
};

const severityOrder = { high: 0, medium: 1, low: 2 };

export default function CritiqueSidebar({ onClose }: CritiqueSidebarProps) {
  const [critiques, setCritiques] = useState<CritiqueCard[]>(INITIAL_CRITIQUES);
  const [filter, setFilter] = useState<'all' | 'gap' | 'contradiction' | 'outdated'>('all');
  const [running, setRunning] = useState(false);

  const active = critiques.filter((c) => !c.dismissed);
  const visible = active
    .filter((c) => filter === 'all' || c.type === filter)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const dismiss = (id: string) => {
    setCritiques((prev) => prev.map((c) => (c.id === id ? { ...c, dismissed: true } : c)));
    toast.success('Critique dismissed', { description: 'You can restore it from history.' });
  };

  const applyAll = () => {
    setCritiques((prev) => prev.map((c) => ({ ...c, dismissed: true })));
    toast.success('All critiques acknowledged', { description: 'Curriculum marked as reviewed.' });
  };

  const rerunCritique = async () => {
    setRunning(true);
    // TODO: POST /api/critique { curriculumId } to re-run the critic agent
    await new Promise((r) => setTimeout(r, 2000));
    setRunning(false);
    toast.success('Critique agent re-run complete', { description: '7 flags found.' });
  };

  const gapCount = active.filter((c) => c.type === 'gap').length;
  const contradictionCount = active.filter((c) => c.type === 'contradiction').length;
  const outdatedCount = active.filter((c) => c.type === 'outdated').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-3 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={13} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Critique</span>
            <span className="text-[10px] font-mono bg-primary/15 text-accent px-1.5 py-0.5 rounded-full">
              {active.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            aria-label="Close critique panel"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Severity summary */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={10} className="text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400 tabular-nums">{gapCount} gaps</span>
          </div>
          <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
            <XCircle size={10} className="text-red-400" />
            <span className="text-[10px] font-mono text-red-400 tabular-nums">{contradictionCount} contra</span>
          </div>
          <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded-md bg-slate-500/10 border border-slate-500/20">
            <Clock size={10} className="text-slate-400" />
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">{outdatedCount} old</span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {(['all', 'gap', 'contradiction', 'outdated'] as const).map((f) => (
            <button
              key={`cf-${f}`}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono capitalize transition-all duration-150 ${
                filter === f
                  ? 'bg-primary/20 text-accent border border-primary/30' :'text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCheck size={28} className="text-success mb-3" />
            <p className="text-xs font-semibold text-foreground mb-1">All critiques resolved</p>
            <p className="text-[11px] text-muted-foreground">
              Your curriculum has been fully reviewed. Re-run the critique agent after adding new papers.
            </p>
          </div>
        ) : (
          visible.map((critique) => {
            const cfg = typeConfig[critique.type];
            const Icon = cfg.icon;
            return (
              <div
                key={critique.id}
                className={`rounded-lg p-3 transition-all duration-200 ${cfg.className}`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-1.5 mb-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <Icon size={12} className={`${cfg.iconColor} shrink-0 mt-0.5`} />
                    <p className="text-[11px] font-semibold text-foreground leading-tight">
                      {critique.title}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(critique.id)}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Dismiss critique (D)"
                    aria-label="Dismiss critique"
                  >
                    <X size={11} />
                  </button>
                </div>

                {/* Severity + type badges */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cfg.badgeClass}`}>
                    {cfg.label}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded capitalize ${
                    critique.severity === 'high' ?'bg-red-500/10 text-red-400 border border-red-500/20'
                      : critique.severity === 'medium' ?'bg-amber-500/10 text-amber-400 border border-amber-500/20' :'bg-muted/50 text-muted-foreground border border-border'
                  }`}>
                    {critique.severity}
                  </span>
                  {critique.paperTitle && (
                    <span className="text-[9px] font-mono text-muted-foreground truncate">
                      · {critique.paperTitle.slice(0, 18)}…
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                  {critique.description}
                </p>

                {/* Suggestion */}
                <div className="rounded-md bg-muted/30 border border-border px-2 py-1.5 mb-2">
                  <p className="text-[9px] font-mono font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Suggestion
                  </p>
                  <p className="text-[10px] text-foreground leading-relaxed">
                    {critique.suggestion}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => dismiss(critique.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-muted/40 hover:bg-muted/60 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-all duration-150"
                  >
                    <X size={9} />
                    Dismiss
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-primary/15 hover:bg-primary/25 text-[10px] font-mono text-accent transition-all duration-150"
                  >
                    <CheckCheck size={9} />
                    Apply
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-border p-3 space-y-2">
        {active.length > 0 && (
          <button
            onClick={applyAll}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/60 text-xs font-mono text-muted-foreground hover:text-foreground transition-all duration-150"
          >
            <CheckCheck size={12} />
            Dismiss all
          </button>
        )}
        <button
          onClick={rerunCritique}
          disabled={running}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-xs font-mono text-accent transition-all duration-150 disabled:opacity-50"
        >
          <Wand2 size={12} className={running ? 'animate-spin' : ''} />
          {running ? 'Running critique…' : 'Re-run critique agent'}
        </button>
      </div>
    </div>
  );
}