'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, BookmarkPlus, Quote, Share2,
  PanelRight, ChevronLeft, ChevronRight, CheckCircle, Circle,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface PaperHeaderProps {
  sidePanelOpen: boolean;
  onToggleSidePanel: () => void;
}

export default function PaperHeader({ sidePanelOpen, onToggleSidePanel }: PaperHeaderProps) {
  const [readStatus, setReadStatus] = useState<'unread' | 'reading' | 'read'>('reading');

  const cycleStatus = () => {
    setReadStatus((prev) => {
      const next = prev === 'unread' ? 'reading' : prev === 'reading' ? 'read' : 'unread';
      toast.success(`Marked as ${next}`);
      return next;
    });
  };

  const statusConfig = {
    unread: { icon: Circle, label: 'Unread', color: 'text-muted-foreground' },
    reading: { icon: BookOpen, label: 'Reading', color: 'text-primary' },
    read: { icon: CheckCircle, label: 'Read', color: 'text-success' },
  };
  const { icon: StatusIcon, label: statusLabel, color: statusColor } = statusConfig[readStatus];

  return (
    <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-5 py-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground mb-2">
        <Link href="/" className="hover:text-foreground transition-colors">ResearchOS</Link>
        <span>/</span>
        <Link href="/curriculum-view" className="hover:text-foreground transition-colors">Attention Mechanisms</Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">Attention Is All You Need</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Left: navigation */}
        <div className="flex items-center gap-2">
          <Link
            href="/curriculum-view"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
          >
            <ArrowLeft size={12} />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border-r border-border" title="Previous paper (K)">
              <ChevronLeft size={13} />
            </button>
            <span className="px-2 text-[10px] font-mono text-muted-foreground tabular-nums">1 / 8</span>
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border-l border-border" title="Next paper (J)">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Center: title (truncated) */}
        <h1 className="hidden lg:block text-sm font-semibold text-foreground truncate flex-1 text-center">
          Attention Is All You Need
        </h1>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={cycleStatus}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs transition-all duration-150 hover:border-primary/30 ${statusColor}`}
            title={`Status: ${statusLabel} — click to cycle`}
          >
            <StatusIcon size={12} />
            <span className="hidden sm:inline font-mono">{statusLabel}</span>
          </button>
          <button
            onClick={() => toast.success('Added to curriculum')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
            title="Add to curriculum"
          >
            <BookmarkPlus size={12} />
          </button>
          <button
            onClick={() => toast.success('Citation copied to clipboard')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
            title="Copy citation"
          >
            <Quote size={12} />
          </button>
          <a
            href="https://arxiv.org/abs/1706.03762"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
            title="Open on arXiv"
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">arXiv</span>
          </a>
          <button
            onClick={() => toast.success('Link copied')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
          >
            <Share2 size={12} />
          </button>
          <button
            onClick={onToggleSidePanel}
            className={`p-1.5 rounded-lg border transition-all duration-150 ${
              sidePanelOpen
                ? 'border-primary/30 bg-primary/10 text-accent' :'border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
            title="Toggle side panel (N)"
            aria-label="Toggle side panel"
          >
            <PanelRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}