'use client';
import React, { useState } from 'react';
import ModuleNav from './ModuleNav';
import PaperListView from './PaperListView';
import TimelineView from './TimelineView';
import KnowledgeGraphView from './KnowledgeGraphView';
import CritiqueSidebar from './CritiqueSidebar';
import CoverageWidget from './CoverageWidget';
import type { ViewMode } from './CurriculumHeader';
import CurriculumHeader from './CurriculumHeader';
import { MessageSquare, ChevronRight } from 'lucide-react';

export default function CurriculumMain() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeModule, setActiveModule] = useState('module-foundational');
  const [critiqueOpen, setCritiqueOpen] = useState(true);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <CurriculumHeader viewMode={viewMode} onViewChange={setViewMode} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Module nav */}
        <div className="w-56 shrink-0 border-r border-border overflow-y-auto scrollbar-thin">
          <ModuleNav activeModule={activeModule} onSelect={setActiveModule} />
          <div className="p-3">
            <CoverageWidget />
          </div>
        </div>

        {/* Center: Content */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
          {viewMode === 'list' && <PaperListView activeModule={activeModule} />}
          {viewMode === 'timeline' && <TimelineView />}
          {viewMode === 'graph' && <KnowledgeGraphView />}
        </div>

        {/* Right: Critique sidebar */}
        <div
          className={`border-l border-border overflow-y-auto scrollbar-thin transition-all duration-300 shrink-0 ${
            critiqueOpen ? 'w-72' : 'w-10'
          }`}
        >
          {critiqueOpen ? (
            <CritiqueSidebar onClose={() => setCritiqueOpen(false)} />
          ) : (
            <button
              onClick={() => setCritiqueOpen(true)}
              className="w-full h-full flex flex-col items-center justify-start pt-4 gap-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open critique panel"
            >
              <MessageSquare size={14} />
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}