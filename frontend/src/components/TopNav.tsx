'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, FileText, Search, Command, Bell, ChevronDown, FlaskConical, LayoutDashboard, ClipboardCheck, Glasses, Landmark } from 'lucide-react';
import SpotlightSearch from './SpotlightSearch';
import StatusBadge from './StatusBadge';
import Icon from '@/components/ui/AppIcon';


interface TopNavProps {
  topic?: string;
  agentStatus?: 'idle' | 'running' | 'done' | 'error';
}

function HealthDot() {
  const [state, setState] = useState<'green' | 'amber' | 'red' | null>(null);
  const [title, setTitle] = useState('Checking backend health…');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((h) => {
        const keys = `Keys — LLM: ${h.env?.llmKey ? 'present' : 'missing'}, Fallback: ${h.env?.fallbackKey ? 'present' : 'missing'}, Resend: ${h.env?.resendKey ? 'present' : 'missing'}, Semantic Scholar: ${h.env?.s2Key ? 'present' : 'missing'}`;
        setTitle(keys);
        setState(h.ok && h.env?.llmKey ? 'green' : h.ok ? 'amber' : 'red');
      })
      .catch(() => {
        setTitle('Backend unreachable');
        setState('red');
      });
  }, []);

  if (!state) return null;
  const colors = { green: '#0d9488', amber: '#d97706', red: '#dc2626' };
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ background: colors[state] }}
      title={title}
      role="status"
      aria-label={title}
    />
  );
}

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/curriculum-view', label: 'Curriculum', icon: BookOpen },
  { href: '/paper-reader', label: 'Papers', icon: FileText },
  { href: '/preflight', label: 'PreFlight', icon: ClipboardCheck },
  { href: '/archive', label: 'Archive', icon: FlaskConical },
  { href: '/reviewer', label: 'Review', icon: Glasses },
  { href: '/grantcraft', label: 'Propose', icon: Landmark },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function TopNav({ topic = 'Attention Mechanisms', agentStatus = 'idle' }: TopNavProps) {
  const pathname = usePathname();
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* macOS-style menu bar */}
      <header
        className="h-11 flex items-center justify-between px-4 shrink-0 z-40 relative"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(32px) saturate(2)',
          WebkitBackdropFilter: 'blur(32px) saturate(2)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* App name */}
          <span className="text-sm font-semibold text-[#1d1d1f] tracking-tight">ResearchOS</span>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-0.5 ml-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
                    active ? 'text-[#4f46e5]' : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="topnav-active-pill"
                      className="absolute inset-0 rounded-md -z-10"
                      style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.15)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <ItemIcon size={12} />
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="topnav-active-dot"
                      className="absolute left-1/2 -bottom-[7px] w-1 h-1 rounded-full -translate-x-1/2"
                      style={{ background: '#4f46e5' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center — breadcrumb */}
        <div className="flex-1 min-w-0 hidden lg:flex items-center justify-center gap-1.5 px-3 text-xs text-[#6e6e73]">
          <span className="font-medium text-[#1d1d1f]">ResearchOS</span>
          <ChevronDown size={10} className="rotate-[-90deg]" />
          <span className="text-[#4f46e5] font-medium truncate max-w-[200px]">{topic}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <HealthDot />
          <StatusBadge status={agentStatus} />

          {/* Search trigger */}
          <button
            onClick={() => setSpotlightOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/5 border border-black/8 text-xs text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/8 transition-all duration-150"
            aria-label="Open search (⌘K)"
          >
            <Search size={12} />
            <span className="hidden lg:block">Search</span>
            <span className="kbd-hint flex items-center gap-0.5">
              <Command size={9} />K
            </span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-1.5 rounded-md text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 transition-all duration-150"
              aria-label="Notifications"
            >
              <Bell size={14} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#4f46e5]" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute right-0 top-9 w-72 rounded-xl overflow-hidden z-50"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                  }}
                >
                  <div className="px-3 py-2 border-b border-black/6">
                    <p className="text-xs font-semibold text-[#1d1d1f]">Notifications</p>
                  </div>
                  {[
                    { id: 'n1', text: 'Critique ready for "Transformer Survey"', time: '2m ago', dot: '#4f46e5' },
                    { id: 'n2', text: 'New papers added to Diffusion Models', time: '18m ago', dot: '#0d9488' },
                    { id: 'n3', text: 'Knowledge graph rebuilt — 47 nodes', time: '1h ago', dot: '#d97706' },
                  ].map((n) => (
                    <div key={n.id} className="px-3 py-2.5 hover:bg-black/4 cursor-pointer border-b border-black/4 last:border-0 flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: n.dot }} />
                      <div>
                        <p className="text-xs text-[#1d1d1f]">{n.text}</p>
                        <p className="text-[10px] font-mono text-[#6e6e73] mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center cursor-pointer">
            <span className="text-[9px] font-bold text-white">AK</span>
          </div>
        </div>
      </header>

      <SpotlightSearch open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
    </>
  );
}
