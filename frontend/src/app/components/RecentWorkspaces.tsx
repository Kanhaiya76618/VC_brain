'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';
import { MOCK_WORKSPACES } from '@/lib/mock/data'; // TODO(mock): no backend endpoint provides this data yet
import StatusBadge from '@/components/StatusBadge';
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher';

export default function RecentWorkspaces() {
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#4f46e5]" />
            <span className="text-xs font-semibold text-[#1d1d1f] tracking-tight">Recent Workspaces</span>
          </div>
          <button
            onClick={() => setSwitcherOpen(true)}
            className="text-[11px] font-medium text-[#4f46e5] hover:text-[#7c3aed] transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={10} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {MOCK_WORKSPACES?.map((ws, i) => (
            <motion.div
              key={ws?.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.06 }}
              whileHover={{ y: -3, scale: 1.01 }}
            >
              <Link href="/curriculum-view">
                <div
                  className="rounded-2xl p-4 cursor-pointer h-full transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                  }}
                >
                  {/* Color accent bar */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${ws?.color}15`, border: `1px solid ${ws?.color}20` }}
                  >
                    <span className="text-base font-bold" style={{ color: ws?.color }}>{ws?.topic?.[0]}</span>
                  </div>

                  <p className="text-xs font-semibold text-[#1d1d1f] line-clamp-2 leading-tight mb-2">
                    {ws?.topic}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <StatusBadge status={ws?.status} size="sm" />
                  </div>

                  {/* Coverage bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#6e6e73]">Coverage</span>
                      <span className="text-[10px] font-mono font-semibold" style={{ color: ws?.color }}>
                        {ws?.coveragePercent}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-black/8 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: ws?.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${ws?.coveragePercent}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-2">
                    <BookOpen size={10} className="text-[#6e6e73]" />
                    <span className="text-[10px] font-mono text-[#6e6e73]">{ws?.paperCount} papers</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <WorkspaceSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
}