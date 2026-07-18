'use client';
import React, { useEffect, useState } from 'react';
import { Check, Loader2, Database, SortAsc, List, MessageSquare, CheckCircle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface PipelineProgressProps {
  state: 'running' | 'done';
}

const STEPS = [
  { id: 'fetch', label: 'Fetching papers', sublabel: 'arXiv · Semantic Scholar', icon: Database, duration: 900 },
  { id: 'rank', label: 'Ranking relevance', sublabel: 'Citation graph · semantic similarity', icon: SortAsc, duration: 700 },
  { id: 'sequence', label: 'Sequencing curriculum', sublabel: 'Foundational → Advanced ordering', icon: List, duration: 1000 },
  { id: 'critique', label: 'Running critique agent', sublabel: 'Gaps · contradictions · outdated refs', icon: MessageSquare, duration: 900 },
  { id: 'done', label: 'Curriculum ready', sublabel: '24 papers · 3 modules · 7 critique flags', icon: CheckCircle, duration: 0 },
];

type StepStatus = 'pending' | 'active' | 'done';

export default function PipelineProgress({ state }: PipelineProgressProps) {
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    Object.fromEntries(STEPS.map((s) => [s.id, 'pending']))
  );
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (state !== 'running') return;
    let idx = 0;
    const advance = () => {
      if (idx >= STEPS.length) return;
      const step = STEPS[idx];
      setCurrentStep(idx);
      setStepStatuses((prev) => ({ ...prev, [step.id]: 'active' }));
      if (step.duration > 0) {
        setTimeout(() => {
          setStepStatuses((prev) => ({ ...prev, [step.id]: 'done' }));
          idx++;
          advance();
        }, step.duration);
      }
    };
    advance();
  }, [state]);

  useEffect(() => {
    if (state === 'done') {
      setStepStatuses(Object.fromEntries(STEPS.map((s) => [s.id, 'done'])));
    }
  }, [state]);

  return (
    <div className="glass-panel rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-foreground">Pipeline Running</p>
        <p className="text-[10px] font-mono text-muted-foreground">
          Step {Math.min(currentStep + 1, STEPS.length)} of {STEPS.length}
        </p>
      </div>
      <div className="flex items-center gap-1 mb-4">
        {STEPS.map((step, i) => {
          const status = stepStatuses[step.id];
          return (
            <React.Fragment key={`progress-${step.id}`}>
              <div
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  status === 'done'
                    ? 'bg-success'
                    : status === 'active' ?'bg-primary animate-pulse' :'bg-border'
                }`}
              />
              {i < STEPS.length - 1 && <div className="w-px" />}
            </React.Fragment>
          );
        })}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {STEPS.map((step) => {
          const status = stepStatuses[step.id];
          const Icon = step.icon;
          return (
            <div
              key={`step-card-${step.id}`}
              className={`rounded-lg p-2.5 border transition-all duration-300 ${
                status === 'active' ?'pipeline-step-active'
                  : status === 'done' ?'pipeline-step-done' :'pipeline-step-pending'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon
                  size={13}
                  className={
                    status === 'active' ?'text-accent'
                      : status === 'done' ?'text-success' :'text-muted-foreground'
                  }
                />
                {status === 'active' && (
                  <Loader2 size={11} className="text-accent animate-spin" />
                )}
                {status === 'done' && (
                  <Check size={11} className="text-success" />
                )}
              </div>
              <p
                className={`text-[10px] font-medium leading-tight ${
                  status === 'active' ?'text-accent'
                    : status === 'done' ?'text-success' :'text-muted-foreground'
                }`}
              >
                {step.label}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground mt-0.5 leading-tight line-clamp-2">
                {step.sublabel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}