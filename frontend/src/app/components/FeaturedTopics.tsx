'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const FEATURED_TOPICS = [
  {
    id: 'ft-001',
    title: 'Attention Mechanisms in Transformers',
    description: 'Self-attention, multi-head attention, positional encoding, and the full transformer architecture.',
    papers: 8,
    color: '#4f46e5',
    tags: ['NLP', 'Deep Learning', 'Foundational'],
  },
  {
    id: 'ft-002',
    title: 'Diffusion Models for Image Generation',
    description: 'DDPM, DDIM, score-based models, and latent diffusion for high-fidelity image synthesis.',
    papers: 12,
    color: '#0d9488',
    tags: ['Computer Vision', 'Generative AI'],
  },
  {
    id: 'ft-003',
    title: 'Reinforcement Learning from Human Feedback',
    description: 'PPO, reward modeling, preference learning, and alignment with human values.',
    papers: 9,
    color: '#d97706',
    tags: ['RL', 'Alignment', 'LLMs'],
  },
  {
    id: 'ft-004',
    title: 'Graph Neural Networks',
    description: 'GCN, GAT, GraphSAGE, and applications in molecular property prediction.',
    papers: 7,
    color: '#7c3aed',
    tags: ['Graphs', 'Drug Discovery'],
  },
  {
    id: 'ft-005',
    title: 'Causal Inference',
    description: 'Structural causal models, do-calculus, counterfactuals, and observational studies.',
    papers: 6,
    color: '#dc2626',
    tags: ['Statistics', 'ML Theory'],
  },
  {
    id: 'ft-006',
    title: 'Federated Learning',
    description: 'Privacy-preserving distributed training, differential privacy, and secure aggregation.',
    papers: 5,
    color: '#6e6e73',
    tags: ['Privacy', 'Distributed ML'],
  },
];

export default function FeaturedTopics() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-[#4f46e5]" />
        <span className="text-xs font-semibold text-[#1d1d1f] tracking-tight">Featured Research Areas</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURED_TOPICS?.map((topic, i) => (
          <motion.div
            key={topic?.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.05 }}
            whileHover={{ y: -2, scale: 1.01 }}
          >
            <Link href="/curriculum-view">
              <div
                className="rounded-2xl p-4 cursor-pointer h-full group transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.68)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: topic?.color }}
                  />
                  <p className="flex-1 text-xs font-semibold text-[#1d1d1f] leading-tight">{topic?.title}</p>
                  <ArrowRight
                    size={12}
                    className="text-[#6e6e73] group-hover:text-[#4f46e5] transition-colors shrink-0 mt-0.5"
                  />
                </div>

                <p className="text-[11px] text-[#6e6e73] leading-relaxed mb-3 line-clamp-2">
                  {topic?.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {topic?.tags?.slice(0, 2)?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md"
                        style={{
                          background: `${topic?.color}10`,
                          color: topic?.color,
                          border: `1px solid ${topic?.color}20`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-[#6e6e73]">{topic?.papers} papers</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}