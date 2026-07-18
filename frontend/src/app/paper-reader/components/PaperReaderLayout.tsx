'use client';
import React, { useState } from 'react';
import PaperHeader from './PaperHeader';
import PaperBody from './PaperBody';
import PaperSidePanel from './PaperSidePanel';
import { PanelRight } from 'lucide-react';

export default function PaperReaderLayout() {
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'related' | 'critique'>('notes');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PaperHeader
        sidePanelOpen={sidePanelOpen}
        onToggleSidePanel={() => setSidePanelOpen((v) => !v)}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main reader */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
          <PaperBody />
        </div>

        {/* Side panel */}
        {sidePanelOpen ? (
          <div className="w-80 xl:w-96 shrink-0 border-l border-border overflow-hidden flex flex-col transition-all duration-300">
            <PaperSidePanel activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        ) : (
          <button
            onClick={() => setSidePanelOpen(true)}
            className="w-10 shrink-0 border-l border-border flex flex-col items-center justify-start pt-4 gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open side panel"
          >
            <PanelRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}