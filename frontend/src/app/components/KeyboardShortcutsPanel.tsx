'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Command } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Open search' },
  { keys: ['G', 'H'], label: 'Go to Home' },
  { keys: ['G', 'C'], label: 'Go to Curriculum' },
  { keys: ['G', 'P'], label: 'Go to Papers' },
  { keys: ['G', 'K'], label: 'Knowledge Graph' },
  { keys: ['G', 'R'], label: 'Critic panel' },
  { keys: ['⌘', 'N'], label: 'New workspace' },
  { keys: ['⌘', '/'], label: 'Toggle notes' },
];

export default function KeyboardShortcutsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      className="rounded-2xl p-4 h-full"
      style={{
        background: 'rgba(255,255,255,0.68)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Command size={13} className="text-[#4f46e5]" />
        <span className="text-xs font-semibold text-[#1d1d1f]">Keyboard Shortcuts</span>
      </div>
      <div className="space-y-1.5">
        {SHORTCUTS?.map((s, i) => (
          <motion.div
            key={`shortcut-${i}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.04 }}
            className="flex items-center justify-between py-1"
          >
            <span className="text-[11px] text-[#6e6e73]">{s?.label}</span>
            <div className="flex items-center gap-1">
              {s?.keys?.map((k, ki) => (
                <React.Fragment key={ki}>
                  <kbd className="kbd-hint">{k}</kbd>
                  {ki < s?.keys?.length - 1 && (
                    <span className="text-[9px] text-[#6e6e73]">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-black/6">
        <p className="text-[10px] text-[#6e6e73] font-mono">
          All shortcuts work globally across ResearchOS
        </p>
      </div>
    </motion.div>
  );
}