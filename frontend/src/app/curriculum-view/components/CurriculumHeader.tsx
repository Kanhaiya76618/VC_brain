'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { List, GitBranch, Clock, BarChart2, RefreshCw, Download, Share2, Layers, MessageSquare } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


export type ViewMode = 'list' | 'timeline' | 'graph';

interface CurriculumHeaderProps {
  viewMode?: ViewMode;
  onViewChange?: (v: ViewMode) => void;
}

export default function CurriculumHeader({ viewMode = 'list', onViewChange }: CurriculumHeaderProps) {
  const [regenerating, setRegenerating] = useState(false);

  const handleRegen = async () => {
    setRegenerating(true);
    // TODO: POST /api/curriculum { topic } to regenerate
    await new Promise((r) => setTimeout(r, 1800));
    setRegenerating(false);
  };

  return (
    <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-5 py-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground mb-2">
        <Link href="/" className="hover:text-foreground transition-colors">ResearchOS</Link>
        <span>/</span>
        <span className="text-foreground">Attention Mechanisms in Transformers</span>
        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-primary/15 text-accent border border-primary/20">
          v2.1 · Generated Jul 14 2026
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Left: title + stats */}
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-base font-bold text-foreground truncate">
            Attention Mechanisms in Transformers
          </h1>
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <Layers size={11} />
              <span className="tabular-nums">24 papers</span>
            </span>
            <span className="flex items-center gap-1">
              <List size={11} />
              <span className="tabular-nums">3 modules</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <MessageSquare size={11} />
              <span className="tabular-nums">7 critique flags</span>
            </span>
            <span className="flex items-center gap-1 text-success">
              <BarChart2 size={11} />
              <span>87% coverage</span>
            </span>
          </div>
        </div>

        {/* Right: view switcher + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View switcher */}
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
            {([
              { mode: 'list' as ViewMode, icon: List, label: 'List' },
              { mode: 'timeline' as ViewMode, icon: Clock, label: 'Timeline' },
              { mode: 'graph' as ViewMode, icon: GitBranch, label: 'Graph' },
            ] as const).map(({ mode, icon: Icon, label }) => (
              <button
                key={`view-${mode}`}
                onClick={() => onViewChange?.(mode)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all duration-150 ${
                  viewMode === mode
                    ? 'bg-primary/15 text-accent font-medium' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <button
            onClick={handleRegen}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150">
            <Download size={12} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150">
            <Share2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}