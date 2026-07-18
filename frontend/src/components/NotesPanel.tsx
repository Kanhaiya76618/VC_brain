'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, X, Plus } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  paperId?: string;
}

const INITIAL_NOTES: Note[] = [
  {
    id: 'note-001',
    content: 'The key insight in "Attention Is All You Need" is that attention mechanisms alone, without recurrence, can achieve state-of-the-art results. The multi-head attention allows the model to jointly attend to information from different representation subspaces.',
    createdAt: '2024-01-15',
    paperId: 'p001',
  },
  {
    id: 'note-002',
    content: 'BERT\'s bidirectional training is crucial — unlike GPT which is unidirectional, BERT can use context from both left and right. The masked language modeling objective is elegant.',
    createdAt: '2024-01-14',
    paperId: 'p002',
  },
];

interface NotesPanelProps {
  open: boolean;
  onClose: () => void;
  paperId?: string;
}

export default function NotesPanel({ open, onClose, paperId }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const filteredNotes = paperId ? notes.filter((n) => n.paperId === paperId) : notes;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes((prev) => [
      {
        id: `note-${Date.now()}`,
        content: newNote.trim(),
        createdAt: new Date().toISOString().split('T')[0],
        paperId,
      },
      ...prev,
    ]);
    setNewNote('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/20 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel — bottom sheet on mobile, side sheet on desktop */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 md:right-0 md:top-11 md:left-auto md:bottom-0 z-[61] md:w-80 flex flex-col"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(32px) saturate(2)',
              WebkitBackdropFilter: 'blur(32px) saturate(2)',
              borderTop: '1px solid rgba(255,255,255,0.95)',
              borderLeft: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
              maxHeight: '70vh',
            }}
          >
            {/* Handle (mobile) */}
            <div className="flex justify-center pt-2 pb-1 md:hidden">
              <div className="w-8 h-1 rounded-full bg-black/15" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/6 shrink-0">
              <StickyNote size={13} className="text-[#d97706]" />
              <span className="text-xs font-semibold text-[#1d1d1f] flex-1">Notes</span>
              <span className="text-[10px] font-mono text-[#6e6e73]">{filteredNotes.length}</span>
              <button
                onClick={() => setIsAdding(true)}
                className="p-1 rounded-lg hover:bg-[rgba(79,70,229,0.1)] text-[#4f46e5] transition-colors"
                aria-label="Add note"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-black/6 text-[#6e6e73] transition-colors"
                aria-label="Close notes"
              >
                <X size={13} />
              </button>
            </div>

            {/* New note input */}
            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                  className="overflow-hidden border-b border-black/6 shrink-0"
                >
                  <div className="p-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a note…"
                      className="w-full text-xs text-[#1d1d1f] placeholder-[#6e6e73] bg-black/4 rounded-xl p-3 outline-none resize-none border border-black/8 focus:border-[#4f46e5]/30 transition-colors"
                      rows={3}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote();
                        if (e.key === 'Escape') setIsAdding(false);
                      }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] font-mono text-[#6e6e73]">⌘↵ to save · Esc to cancel</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setIsAdding(false)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-[#6e6e73] bg-black/6 hover:bg-black/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-40 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
              {filteredNotes.length === 0 ? (
                <div className="py-8 text-center">
                  <StickyNote size={24} className="text-[#6e6e73]/40 mx-auto mb-2" />
                  <p className="text-xs text-[#6e6e73]">No notes yet</p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="mt-2 text-[11px] text-[#4f46e5] font-medium hover:underline"
                  >
                    Add your first note
                  </button>
                </div>
              ) : (
                filteredNotes.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group rounded-xl p-3 bg-black/3 border border-black/6 hover:border-black/10 transition-colors"
                  >
                    <p className="text-[11px] text-[#3d3d3f] leading-relaxed">{note.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] font-mono text-[#6e6e73]">{note.createdAt}</span>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#6e6e73] hover:text-[#dc2626] transition-all"
                        aria-label="Delete note"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
