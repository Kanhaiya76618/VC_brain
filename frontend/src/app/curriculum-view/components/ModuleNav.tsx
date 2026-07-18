'use client';
import React from 'react';
import { CheckCircle, Circle, Lock, BookOpen } from 'lucide-react';

interface ModuleNavProps {
  activeModule: string;
  onSelect: (id: string) => void;
}

const MODULES = [
  {
    id: 'module-foundational',
    label: 'Foundational',
    difficulty: 'foundational' as const,
    papers: 8,
    completed: 5,
    status: 'in-progress' as const,
    description: 'Core attention mechanisms, seq2seq, and early transformer architecture',
  },
  {
    id: 'module-intermediate',
    label: 'Intermediate',
    difficulty: 'intermediate' as const,
    papers: 10,
    completed: 3,
    status: 'in-progress' as const,
    description: 'BERT, GPT, scaling laws, and efficient attention variants',
  },
  {
    id: 'module-advanced',
    label: 'Advanced',
    difficulty: 'advanced' as const,
    papers: 6,
    completed: 0,
    status: 'locked' as const,
    description: 'Flash attention, linear attention, and architectural innovations',
  },
];

const difficultyStyles = {
  foundational: 'difficulty-foundational',
  intermediate: 'difficulty-intermediate',
  advanced: 'difficulty-advanced',
};

export default function ModuleNav({ activeModule, onSelect }: ModuleNavProps) {
  return (
    <div className="p-3">
      <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">
        Modules
      </p>
      <div className="space-y-1">
        {MODULES.map((mod) => {
          const isActive = activeModule === mod.id;
          const progress = Math.round((mod.completed / mod.papers) * 100);
          return (
            <button
              key={mod.id}
              onClick={() => mod.status !== 'locked' && onSelect(mod.id)}
              disabled={mod.status === 'locked'}
              className={`w-full text-left px-2.5 py-2.5 rounded-lg border transition-all duration-150 ${
                isActive
                  ? 'bg-primary/10 border-primary/30'
                  : mod.status === 'locked' ?'opacity-40 cursor-not-allowed border-transparent' :'border-transparent hover:bg-muted/40 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${difficultyStyles[mod.difficulty]}`}>
                  {mod.label}
                </span>
                {mod.status === 'locked' ? (
                  <Lock size={11} className="text-muted-foreground" />
                ) : mod.completed === mod.papers ? (
                  <CheckCircle size={11} className="text-success" />
                ) : (
                  <Circle size={11} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <BookOpen size={10} className="text-muted-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {mod.completed}/{mod.papers} papers
                </span>
              </div>
              <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5 leading-tight line-clamp-2">
                {mod.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}