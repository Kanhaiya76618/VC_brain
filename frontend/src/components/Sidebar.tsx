'use client';
import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  Home,
  BookOpen,
  GitBranch,
  FileText,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Zap,
  FolderOpen,
  BarChart2,
  HelpCircle,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeRoute?: string;
}

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { href: '/', label: 'Home', icon: Home, shortcut: 'G H' },
      { href: '/curriculum-view', label: 'Curriculum', icon: Layers, shortcut: 'G C', badge: 3 },
      { href: '/paper-reader', label: 'Papers', icon: FileText, shortcut: 'G P', badge: 12 },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { href: '/curriculum-view#graph', label: 'Knowledge Graph', icon: GitBranch, shortcut: 'G K' },
      { href: '/curriculum-view#critique', label: 'Critiques', icon: MessageSquare, shortcut: 'G R', badge: 7 },
      { href: '/curriculum-view#progress', label: 'Progress', icon: BarChart2, shortcut: 'G X' },
    ],
  },
  {
    label: 'Library',
    items: [
      { href: '#workspaces', label: 'Workspaces', icon: FolderOpen, shortcut: 'G W' },
      { href: '#notes', label: 'Notes', icon: BookOpen, shortcut: 'G N' },
      { href: '#pipeline', label: 'Pipeline', icon: Zap, shortcut: 'G I' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, activeRoute }: SidebarProps) {
  return (
    <aside
      className="relative flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-in-out z-30 shrink-0"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-border shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <AppLogo size={28} />
          {!collapsed && (
            <span className="font-semibold text-sm text-foreground whitespace-nowrap tracking-tight">
              ResearchOS
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {navGroups.map((group) => (
          <div key={`group-${group.label}`} className="mb-4">
            {!collapsed && (
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.href || (item.href === '/' && activeRoute === '/');
              return (
                <Link
                  key={`nav-${item.href}-${item.label}`}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`
                    group relative flex items-center gap-2.5 px-2 py-2 rounded-md mb-0.5 text-sm transition-all duration-150
                    ${isActive
                      ? 'bg-primary/10 text-accent font-medium' :'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-mono bg-primary/15 text-accent px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      <span className="kbd-hint opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.shortcut}
                      </span>
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 shrink-0">
        <Link
          href="#help"
          className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150"
          title={collapsed ? 'Help' : undefined}
        >
          <HelpCircle size={16} className="shrink-0" />
          {!collapsed && <span className="truncate">Help & Shortcuts</span>}
        </Link>
        <Link
          href="#settings"
          className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150"
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span className="truncate">Settings</span>}
        </Link>
        {/* User */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mt-1 rounded-md hover:bg-muted/50 cursor-pointer transition-all duration-150">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-accent">AK</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Arjun Kapoor</p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">PhD Candidate</p>
            </div>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-150 z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}