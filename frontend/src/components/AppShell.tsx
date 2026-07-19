'use client';
import React from 'react';

import TopNav from './TopNav';
import Dock from './Dock';

interface AppShellProps {
  children: React.ReactNode;
  topic?: string;
  agentStatus?: 'idle' | 'running' | 'done' | 'error';
  bouncingDockItem?: string;
}

export default function AppShell({ children, topic, agentStatus = 'idle', bouncingDockItem }: AppShellProps) {
  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #f0f0f5 0%, #e8e8f0 30%, #f2f0f8 60%, #ebebf0 100%)',
      }}
    >
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute top-1/3 -right-24 w-80 h-80 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(13,148,136,0.2) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Top nav */}
      <div className="relative z-40">
        <TopNav topic={topic} agentStatus={agentStatus} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin relative z-10 pb-24">
        {children}
      </main>

      {/* Bottom Dock */}
      <Dock bouncingItem={bouncingDockItem} />
    </div>
  );
}
