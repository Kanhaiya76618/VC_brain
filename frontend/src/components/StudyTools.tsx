'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotebookPen, X, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { getStudentId } from '@/lib/studentId';

type Tab = 'notes' | 'timer';

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

function NotesTab() {
  const [text, setText] = useState('');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const keyRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    keyRef.current = `researchos-notes-${getStudentId()}`;
    setText(localStorage.getItem(keyRef.current) ?? '');
  }, []);

  const onChange = (value: string) => {
    setText(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.setItem(keyRef.current, value);
      setSavedAt(new Date());
    }, 500);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="flex flex-col h-full p-3">
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Scratch notes — saved locally in this browser."
        aria-label="Study notes"
        className="flex-1 w-full text-xs leading-relaxed rounded-xl p-3 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#4f46e5]/30 text-[#1d1d1f] placeholder:text-[#9a9a9e] resize-none"
      />
      <p className="text-[9px] font-mono text-[#9a9a9e] mt-2 text-right">
        {savedAt ? `Last saved ${savedAt.toLocaleTimeString()}` : 'Autosaves as you type'}
      </p>
    </div>
  );
}

function TimerTab() {
  const [phase, setPhase] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        // phase flip
        setPhase((p) => (p === 'focus' ? 'break' : 'focus'));
        return phase === 'focus' ? BREAK_SECONDS : FOCUS_SECONDS;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  useEffect(() => {
    if (running) {
      document.title = `${mm}:${ss} · ${phase === 'focus' ? 'Focus' : 'Break'} — ResearchOS`;
    }
    return () => { document.title = 'ResearchOS — AI-Native Research Operating System'; };
  }, [running, mm, ss, phase]);

  const reset = () => {
    setRunning(false);
    setPhase('focus');
    setSecondsLeft(FOCUS_SECONDS);
  };

  const color = phase === 'focus' ? '#4f46e5' : '#0d9488';

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
      <span
        className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest"
        style={{ background: `${color}12`, color }}
      >
        {phase === 'focus' ? 'Focus' : 'Break'}
      </span>
      <p className="text-5xl font-bold tabular-nums" style={{ color: '#1d1d1f', fontVariantNumeric: 'tabular-nums' }}>
        {mm}:{ss}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? 'Pause timer' : 'Start timer'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-150 active:scale-[0.98]"
          style={{ background: color }}
        >
          {running ? <Pause size={12} /> : <Play size={12} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6e6e73] bg-black/5 hover:bg-black/8 transition-all duration-150"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>
      <p className="text-[10px] text-[#9a9a9e] text-center leading-relaxed">
        25 minutes of focus, 5 of break. The tab title tracks the countdown.
      </p>
    </div>
  );
}

export default function StudyTools() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('notes');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label="Study tools"
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="absolute bottom-14 right-0 w-72 max-w-[calc(100vw-2rem)] h-[22rem] max-h-[65vh] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(32px) saturate(2)',
              WebkitBackdropFilter: 'blur(32px) saturate(2)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,1)',
            }}
          >
            <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
              <div className="flex items-center gap-1 rounded-lg bg-black/5 p-0.5">
                {([
                  { id: 'notes' as Tab, label: 'Notes', icon: NotebookPen },
                  { id: 'timer' as Tab, label: 'Timer', icon: Timer },
                ]).map((t) => {
                  const TabIcon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      aria-pressed={active}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150"
                      style={active ? { background: 'white', color: '#1d1d1f', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' } : { color: '#6e6e73' }}
                    >
                      <TabIcon size={11} /> {t.label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close study tools"
                className="p-1 rounded-md text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors duration-150"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 min-h-0 border-t border-black/6">
              {tab === 'notes' ? <NotesTab /> : <TimerTab />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close study tools' : 'Open study tools'}
        aria-expanded={open}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: open ? 'linear-gradient(135deg, #0d9488, #4f46e5)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: open ? 'none' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <NotebookPen size={17} color={open ? 'white' : '#0d9488'} />
      </motion.button>
    </div>
  );
}
