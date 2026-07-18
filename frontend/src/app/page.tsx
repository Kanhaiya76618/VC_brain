import React from 'react';
import AppShell from '@/components/AppShell';
import SearchHero from './components/SearchHero';
import RecentWorkspaces from './components/RecentWorkspaces';
import FeaturedTopics from './components/FeaturedTopics';
import KeyboardShortcutsPanel from './components/KeyboardShortcutsPanel';

export default function HomePage() {
  return (
    <AppShell topic="New Research Topic" agentStatus="idle">
      <div className="relative min-h-full">
        <div className="bg-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="bg-radial-glow absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-screen-xl mx-auto px-5 lg:px-8 py-6">
          <SearchHero />
          <RecentWorkspaces />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <FeaturedTopics />
            </div>
            <div>
              <KeyboardShortcutsPanel />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}