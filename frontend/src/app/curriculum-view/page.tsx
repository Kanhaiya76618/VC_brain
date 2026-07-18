'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

import AppShell from '@/components/AppShell';
import CurriculumBoard from './components/CurriculumBoard';
import CoverageMeter from './components/CoverageMeter';
import CriticPanel from './components/CriticPanel';
import KnowledgeGraphView from './components/KnowledgeGraphView';
import { Layers, GitBranch } from 'lucide-react';

type ViewMode = 'curriculum' | 'graph';

export default function CurriculumViewPage() {
  const [viewMode, setViewModeState] = useState<ViewMode>('curriculum');

  // The Dock deep-links here with a hash (#graph, #critique) — read it on
  // load and whenever it changes so those links actually land on the right
  // sub-view instead of always showing the default tab.
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash;
      setViewModeState(hash === '#graph' ? 'graph' : 'curriculum');
      if (hash === '#critique') {
        requestAnimationFrame(() => {
          document.getElementById('critic-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    const newHash = mode === 'graph' ? '#graph' : '';
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', `${window.location.pathname}${newHash}`);
    }
  }, []);

  return (
    <AppShell topic="Attention Mechanisms in Transformers" agentStatus="done">
      <div className="flex flex-col h-full">
        {/* View switcher */}
        <div
          className="flex items-center gap-1 px-4 py-2 border-b"
          style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.5)' }}
        >
          {[
            { id: 'curriculum' as ViewMode, label: 'Curriculum', icon: Layers },
            { id: 'graph' as ViewMode, label: 'Knowledge Graph', icon: GitBranch },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const active = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                aria-pressed={active}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                  active ? 'text-[#4f46e5]' : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="curriculum-tab-pill"
                    className="absolute inset-0 rounded-lg -z-10"
                    style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.15)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <TabIcon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          {viewMode === 'curriculum' ? (
            <>
              {/* Left: Curriculum board */}
              <div className="flex-1 overflow-hidden">
                <CurriculumBoard />
              </div>

              {/* Right sidebar */}
              <div
                className="w-72 shrink-0 overflow-y-auto scrollbar-thin p-3 space-y-3 border-l"
                style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.3)' }}
              >
                <CoverageMeter />
                <div id="critic-panel">
                  <CriticPanel />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-hidden">
              <KnowledgeGraphView />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}