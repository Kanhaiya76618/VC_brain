'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MOCK_WORKSPACES, type Workspace } from '@/lib/mock/data'; // TODO(mock): no backend endpoint provides this data yet
import StatusBadge from './StatusBadge';

interface WorkspaceSwitcherProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (ws: Workspace) => void;
}

export default function WorkspaceSwitcher({ open, onClose, onSelect }: WorkspaceSwitcherProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] spotlight-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[91] flex items-center justify-center p-8 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="pointer-events-auto w-full max-w-4xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white/90 tracking-wide">Workspaces</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                  aria-label="Close workspace switcher"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Stage Manager-style thumbnail grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MOCK_WORKSPACES.map((ws, i) => (
                  <motion.div
                    key={ws.id}
                    initial={{ opacity: 0, scale: 0.85, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.05 }}
                    whileHover={{ scale: 1.04, y: -4 }}
                    className="cursor-pointer"
                    onHoverStart={() => setHovered(ws.id)}
                    onHoverEnd={() => setHovered(null)}
                    onClick={() => { onSelect?.(ws); onClose(); }}
                  >
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: hovered === ws.id ? `2px solid ${ws.color}` : '2px solid rgba(255,255,255,0.6)',
                        boxShadow: hovered === ws.id
                          ? `0 16px 48px rgba(0,0,0,0.2), 0 0 0 1px ${ws.color}30`
                          : '0 8px 24px rgba(0,0,0,0.12)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Thumbnail preview */}
                      <div
                        className="h-28 relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${ws.color}15 0%, ${ws.color}05 100%)` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold"
                            style={{ background: `${ws.color}20`, color: ws.color }}
                          >
                            {ws.topic[0]}
                          </div>
                        </div>
                        {/* Coverage bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                          <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${ws.coveragePercent}%`, background: ws.color }}
                          />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-xs font-semibold text-[#1d1d1f] line-clamp-2 leading-tight mb-1.5">
                          {ws.topic}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[#6e6e73]">{ws.paperCount} papers</span>
                          <StatusBadge status={ws.status} size="sm" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
