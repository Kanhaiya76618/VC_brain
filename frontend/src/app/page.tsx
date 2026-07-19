'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Radar, SlidersHorizontal, Inbox, ArrowRight, BookOpen, GitBranch, MessageCircle, Search } from 'lucide-react';
import AppShell from '@/components/AppShell';

const ENTRY_POINTS = [
  {
    href: '/pipeline',
    icon: LayoutDashboard,
    color: '#4f46e5',
    title: 'Pipeline',
    desc: 'Sourcing → Screening → Diligence → Decision, with median time-to-decision in the header. Seed the demo deal and run the full agent chain.',
  },
  {
    href: '/leads',
    icon: Radar,
    color: '#0d9488',
    title: 'Scout',
    desc: 'Outbound formation detector over GitHub, Hacker News and arXiv. Each reach-out candidate answers "why now?" with the link graph that produced it.',
  },
  {
    href: '/thesis',
    icon: SlidersHorizontal,
    color: '#7c3aed',
    title: 'Thesis & query',
    desc: 'Configure the fund lens (live re-ranks Scout), and resolve a compound natural-language query in one pass over the evidence graph.',
  },
  {
    href: '/apply',
    icon: Inbox,
    color: '#d97706',
    title: 'Apply',
    desc: 'Inbound: company name + deck is the minimum bar. The deck becomes atomic claims and enters the same funnel — including the cold-start path.',
  },
];

export default function HomePage() {
  const [sourceQuery, setSourceQuery] = useState('');
  const sourceUrl = (source: 'github' | 'arxiv' | 'hn') => {
    const query = encodeURIComponent(sourceQuery.trim());
    if (!query) return;
    const urls = {
      github: `https://github.com/search?q=${query}&type=repositories`,
      arxiv: `https://arxiv.org/search/?query=${query}&searchtype=all`,
      hn: `https://hn.algolia.com/?q=${query}`,
    };
    window.open(urls[source], '_blank', 'noopener,noreferrer');
  };

  return (
    <AppShell topic="Home" agentStatus="idle">
      <div className="relative min-h-full">
        <div className="bg-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="bg-radial-glow absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-14">
          <p className="eyebrow mb-2">Maschmeyer Group × Hack-Nation · Challenge 02</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            VC Brain — an operating system for venture capital
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mb-8">
            One append-only evidence graph across Sourcing, Screening, Diligence and Decision. Eight agents
            source pre-raise signals, extract atomic claims, verify them independently, preserve every
            contradiction, and score three independent axes — never averaged. The system recommends and shows
            its work; a human decides.
          </p>

          <section className="glass rounded-2xl p-5 mb-5" aria-labelledby="source-explorer-heading">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p className="eyebrow mb-1">Research sources</p>
                <h2 id="source-explorer-heading" className="text-base font-semibold text-foreground">Search GitHub, arXiv, and Hacker News</h2>
                <p className="text-xs text-muted-foreground mt-1">Explore an idea directly, or use Scout to ingest bounded, evidence-backed signals into VC Brain.</p>
              </div>
              <Link href="/leads" className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: '#0d9488' }}>
                Open Scout <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex items-center gap-2 flex-1 rounded-xl bg-white/70 border border-black/10 px-3 py-2.5">
                <Search size={15} className="text-muted-foreground" />
                <input
                  value={sourceQuery}
                  onChange={(event) => setSourceQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') sourceUrl('github'); }}
                  placeholder="Search a company, technology, or research area…"
                  aria-label="Search research sources"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
              <div className="flex gap-2">
                <button onClick={() => sourceUrl('github')} disabled={!sourceQuery.trim()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488' }}><GitBranch size={14} /> GitHub</button>
                <button onClick={() => sourceUrl('arxiv')} disabled={!sourceQuery.trim()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}><BookOpen size={14} /> arXiv</button>
                <button onClick={() => sourceUrl('hn')} disabled={!sourceQuery.trim()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}><MessageCircle size={14} /> HN</button>
              </div>
            </div>
          </section>

          <div className="grid sm:grid-cols-2 gap-4">
            {ENTRY_POINTS.map((e) => {
              const IconCmp = e.icon;
              return (
                <Link key={e.href} href={e.href} className="block">
                  <div className="glass glass-hover rounded-2xl p-5 h-full">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${e.color}18` }}
                      >
                        <IconCmp size={17} style={{ color: e.color }} />
                      </div>
                      <p className="text-base font-semibold text-foreground">{e.title}</p>
                      <ArrowRight size={14} className="ml-auto text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{e.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="glass-subtle rounded-xl px-4 py-3 mt-6 text-xs text-muted-foreground">
            New here? Start on{' '}
            <Link href="/pipeline" className="font-semibold" style={{ color: '#4f46e5' }}>
              Pipeline
            </Link>
            , seed the synthetic deal, and run diligence — it exercises the whole system end to end in about a
            minute.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
