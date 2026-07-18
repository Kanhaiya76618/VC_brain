'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Info, MessageCircle, ArrowRight } from 'lucide-react';
import { MOCK_AGENTS, MOCK_ASSISTANT_QA, ASSISTANT_FALLBACK } from '@/lib/mock/data'; // TODO(mock): no backend endpoint provides this data yet

type Tab = 'assistant' | 'about';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

function matchAssistantAnswer(input: string): string {
  const normalized = input.toLowerCase();
  const hit = MOCK_ASSISTANT_QA.find((qa) =>
    qa.question
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .some((word) => normalized.includes(word))
  );
  return hit ? hit.answer : ASSISTANT_FALLBACK;
}

function AssistantTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm0', role: 'assistant', text: "Hi, I'm the ResearchOS Assistant. Ask me how something works, or pick a question below." },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: matchAssistantAnswer(trimmed) },
      ]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed"
              style={
                m.role === 'user'
                  ? { background: '#4f46e5', color: 'white' }
                  : { background: 'rgba(0,0,0,0.05)', color: '#1d1d1f' }
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#6e6e73' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {messages.length < 3 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {MOCK_ASSISTANT_QA.map((qa) => (
            <button
              key={qa.id}
              onClick={() => send(qa.question)}
              className="text-[10px] px-2 py-1 rounded-full bg-black/5 hover:bg-black/8 text-[#4f46e5] transition-colors duration-150"
            >
              {qa.question}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 px-3 py-3 border-t border-black/6"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about ResearchOS…"
          aria-label="Ask the ResearchOS assistant"
          className="flex-1 text-xs px-3 py-2 rounded-lg bg-black/5 outline-none focus:ring-1 focus:ring-[#4f46e5]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e]"
        />
        <button
          type="submit"
          aria-label="Send"
          className="p-2 rounded-lg bg-[#4f46e5] text-white hover:bg-[#433add] transition-colors duration-150 disabled:opacity-40"
          disabled={!input.trim()}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="overflow-y-auto scrollbar-thin px-4 py-4 h-full">
      <p className="text-xs leading-relaxed text-[#3a3a3d] mb-4">
        ResearchOS turns any research topic into a structured, critiqued curriculum — automatically
        fetching literature, sequencing it into a reading path, mapping it as a knowledge graph, and
        auditing it for gaps and contradictions.
      </p>

      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6e6e73] mb-3">
        Multi-Agent System
      </p>

      <div className="space-y-2">
        {MOCK_AGENTS.map((agent, i) => (
          <React.Fragment key={agent.id}>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: `1px solid ${agent.color}25`,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold"
                style={{ background: `${agent.color}18`, color: agent.color }}
              >
                {agent.stage}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-[#1d1d1f]">{agent.name}</p>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${agent.color}15`, color: agent.color }}>
                    {agent.role}
                  </span>
                </div>
                <p className="text-[11px] text-[#6e6e73] mt-0.5 leading-snug">{agent.description}</p>
              </div>
            </motion.div>
            {i < MOCK_AGENTS.length - 1 && (
              <div className="flex justify-center">
                <ArrowRight size={12} className="text-black/20 rotate-90" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function HelpAssistant() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('assistant');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="ResearchOS assistant"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="absolute bottom-14 left-0 w-80 max-w-[calc(100vw-2rem)] h-[26rem] max-h-[70vh] rounded-2xl overflow-hidden flex flex-col"
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
                <button
                  onClick={() => setTab('assistant')}
                  aria-pressed={tab === 'assistant'}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150"
                  style={tab === 'assistant' ? { background: 'white', color: '#1d1d1f', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' } : { color: '#6e6e73' }}
                >
                  <MessageCircle size={11} /> Assistant
                </button>
                <button
                  onClick={() => setTab('about')}
                  aria-pressed={tab === 'about'}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150"
                  style={tab === 'about' ? { background: 'white', color: '#1d1d1f', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' } : { color: '#6e6e73' }}
                >
                  <Info size={11} /> About
                </button>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="p-1 rounded-md text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors duration-150"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 min-h-0 border-t border-black/6">
              {tab === 'assistant' ? <AssistantTab /> : <AboutTab />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close ResearchOS assistant' : 'Open ResearchOS assistant'}
        aria-expanded={open}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: open ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: open ? 'none' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <Sparkles size={18} color={open ? 'white' : '#4f46e5'} />
      </motion.button>
    </div>
  );
}
