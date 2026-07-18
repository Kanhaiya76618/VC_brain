'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, Command, Menu, GitBranch, Zap } from 'lucide-react';

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <span className="text-foreground font-medium">ResearchOS</span>
          <span>/</span>
          <span className="text-accent">Attention Mechanisms</span>
        </div>
      </div>

      {/* Center — quick search trigger */}
      <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-150 min-w-[220px]">
        <Search size={14} />
        <span className="flex-1 text-left text-xs">Search papers, topics…</span>
        <span className="kbd-hint flex items-center gap-0.5">
          <Command size={9} />
          <span>K</span>
        </span>
      </button>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Pipeline status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] font-mono text-success">Pipeline Ready</span>
        </div>

        <Link
          href="/curriculum-view"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border transition-all duration-150"
        >
          <GitBranch size={13} />
          <span>Graph</span>
        </Link>

        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border transition-all duration-150"
        >
          <Zap size={13} />
          <span>New Topic</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-72 glass-panel rounded-lg shadow-elevated border border-border z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-foreground">Notifications</p>
              </div>
              {[
                { id: 'notif-001', text: 'Critique ready for "Transformer Survey"', time: '2m ago', type: 'critique' },
                { id: 'notif-002', text: 'New papers added to Diffusion Models workspace', time: '18m ago', type: 'update' },
                { id: 'notif-003', text: 'Knowledge graph rebuilt — 47 nodes', time: '1h ago', type: 'graph' },
              ].map((n) => (
                <div key={n.id} className="px-3 py-2.5 hover:bg-muted/30 cursor-pointer border-b border-border/50 last:border-0">
                  <p className="text-xs text-foreground">{n.text}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}