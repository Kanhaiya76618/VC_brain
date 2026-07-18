'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Database, Filter, Save, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getThesis, queryEvidenceGraph, saveThesis, type GraphQueryResponse, type Thesis, type ThesisInput } from '@/lib/vcApi';

const EMPTY_THESIS: Thesis = {
  thesis_id: 'loading', name: '', active: true, sectors: [], stages: [], geographies: [],
  check_size: { min: 100000, max: 1000000, currency: 'USD' }, ownership_target: 10, risk_appetite: 'medium',
};

function csv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function ThesisPage() {
  const [thesis, setThesis] = useState<Thesis>(EMPTY_THESIS);
  const [query, setQuery] = useState('technical founder, Berlin, AI infra, enterprise traction, no prior VC backing, top-tier accelerator');
  const [results, setResults] = useState<GraphQueryResponse | null>(null);
  const [busy, setBusy] = useState<'save' | 'query' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getThesis().then(({ thesis: loaded }) => setThesis(loaded)).catch((reason: Error) => setError(reason.message));
  }, []);

  const update = <K extends keyof Thesis>(key: K, value: Thesis[K]) => setThesis((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setBusy('save'); setError(null); setNotice(null);
    try {
      const input: ThesisInput = {
        name: thesis.name,
        sectors: thesis.sectors,
        stages: thesis.stages,
        geographies: thesis.geographies,
        check_size: thesis.check_size,
        ownership_target: thesis.ownership_target,
        risk_appetite: thesis.risk_appetite,
      };
      const response = await saveThesis(input);
      setThesis(response.thesis);
      setNotice('Saved as a new auditable thesis version. Scout rankings now use this configuration.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };
  const search = async () => {
    setBusy('query'); setError(null); setNotice(null);
    try { setResults(await queryEvidenceGraph(query)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };

  return (
    <AppShell topic="Thesis & graph query" agentStatus={busy ? 'running' : 'idle'}>
      <div className="max-w-7xl mx-auto px-6 py-8 grid xl:grid-cols-[390px_minmax(0,1fr)] gap-6">
        <section className="glass rounded-2xl p-5 h-fit">
          <div className="flex items-center gap-2"><SlidersHorizontal size={16} style={{ color: '#4f46e5' }} /><div><p className="eyebrow">Phase 3</p><h1 className="text-lg font-bold text-foreground">Active thesis</h1></div></div>
          <p className="text-xs text-muted-foreground mt-3">Config is append-only. A new version changes Scout ranking live; it never rewrites lead evidence.</p>
          <div className="space-y-3 mt-5">
            <label className="block text-[10px] font-semibold text-muted-foreground">NAME<input value={thesis.name} onChange={(e) => update('name', e.target.value)} className="mt-1 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-300" /></label>
            <label className="block text-[10px] font-semibold text-muted-foreground">SECTORS <span className="font-normal">(comma separated)</span><input value={thesis.sectors.join(', ')} onChange={(e) => update('sectors', csv(e.target.value))} placeholder="AI infrastructure, software" className="mt-1 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-300" /></label>
            <label className="block text-[10px] font-semibold text-muted-foreground">STAGES <span className="font-normal">(comma separated)</span><input value={thesis.stages.join(', ')} onChange={(e) => update('stages', csv(e.target.value))} placeholder="pre-seed, seed" className="mt-1 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-300" /></label>
            <label className="block text-[10px] font-semibold text-muted-foreground">GEOGRAPHIES <span className="font-normal">(empty = global)</span><input value={thesis.geographies.join(', ')} onChange={(e) => update('geographies', csv(e.target.value))} placeholder="Berlin, Germany" className="mt-1 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-300" /></label>
            <div className="grid grid-cols-2 gap-3"><label className="block text-[10px] font-semibold text-muted-foreground">MIN CHECK<input type="number" value={thesis.check_size.min} onChange={(e) => update('check_size', { ...thesis.check_size, min: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-300" /></label><label className="block text-[10px] font-semibold text-muted-foreground">MAX CHECK<input type="number" value={thesis.check_size.max} onChange={(e) => update('check_size', { ...thesis.check_size, max: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-300" /></label></div>
            <div className="grid grid-cols-2 gap-3"><label className="block text-[10px] font-semibold text-muted-foreground">OWNERSHIP %<input type="number" min="0" max="100" value={thesis.ownership_target} onChange={(e) => update('ownership_target', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-300" /></label><label className="block text-[10px] font-semibold text-muted-foreground">RISK<select value={thesis.risk_appetite} onChange={(e) => update('risk_appetite', e.target.value as Thesis['risk_appetite'])} className="mt-1 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-300"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div>
            <button onClick={save} disabled={busy !== null} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}><Save size={12} /> Save & re-rank Scout leads</button>
          </div>
        </section>

        <section>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-start gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(13,148,136,0.1)' }}><Search size={17} style={{ color: '#0d9488' }} /></div><div><p className="eyebrow">One-pass evidence query</p><h2 className="text-lg font-bold text-foreground">Multi-attribute graph reasoning</h2><p className="text-xs text-muted-foreground mt-1">Each clause is resolved together against the evidence graph. Results cite the source claim that matched it.</p></div></div>
            <div className="flex gap-2 mt-5"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search(); }} className="flex-1 rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-teal-300" aria-label="Compound graph query" /><button onClick={search} disabled={busy !== null || !query.trim()} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ background: '#0d9488' }}><Filter size={12} /> Query graph</button></div>
            {notice && <p className="mt-3 text-xs" style={{ color: '#0d9488' }}><CheckCircle2 size={12} className="inline mr-1" />{notice}</p>}
            {error && <p className="mt-3 text-xs" style={{ color: '#dc2626' }}>{error}</p>}
          </div>

          {results && <div className="mt-5 space-y-4">
            <div className="glass-subtle rounded-xl px-4 py-3"><p className="eyebrow mb-1">Parsed clauses</p><div className="flex flex-wrap gap-1.5">{results.clauses.map((clause) => <span key={`${clause.key}-${clause.value}`} className="rounded-md px-2 py-1 text-[10px] font-semibold" style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5' }}>{clause.label}</span>)}</div></div>
            <ResultGroup title={`Qualified results · ${results.results.length}`} entries={results.results} qualified />
            {results.near_misses.length > 0 && <ResultGroup title={`Near misses · ${results.near_misses.length}`} entries={results.near_misses} qualified={false} />}
          </div>}
        </section>
      </div>
    </AppShell>
  );
}

function ResultGroup({ title, entries, qualified }: { title: string; entries: GraphQueryResponse['results']; qualified: boolean }) {
  return <section><h3 className="text-sm font-bold text-foreground mb-2">{title}</h3><div className="space-y-3">{entries.length === 0 && <div className="glass-subtle rounded-xl p-4 text-xs text-muted-foreground">No company has source evidence for every requested clause yet.</div>}{entries.map((entry) => <article key={entry.company.company_id} className="glass rounded-2xl p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-bold text-foreground">{entry.company.canonical_name}</h4><p className="text-[10px] font-mono text-muted-foreground">{entry.company.primary_domain ?? 'domain not disclosed'}</p></div><span className="rounded-md px-2 py-1 text-[10px] font-mono font-semibold" style={{ color: qualified ? '#0d9488' : '#d97706', background: qualified ? 'rgba(13,148,136,0.1)' : 'rgba(217,119,6,0.1)' }}>{entry.matched.length} / {entry.matched.length + entry.missing.length} clauses</span></div><div className="space-y-2 mt-3">{entry.matched.map(({ clause, evidence }) => <div key={evidence.claim_id} className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.03)' }}><p className="text-[10px] font-semibold" style={{ color: '#0d9488' }}><CheckCircle2 size={10} className="inline mr-1" />{clause.label}</p><p className="text-[11px] text-foreground mt-0.5">“{evidence.quote}”</p><p className="text-[9px] font-mono text-muted-foreground mt-1"><Database size={9} className="inline mr-1" />{evidence.artifact?.title ?? evidence.claim_id} · {evidence.artifact?.fetched_at.slice(0, 10) ?? 'no artifact timestamp'}</p></div>)}{entry.missing.map((clause) => <p key={`${clause.key}-${clause.value}`} className="text-[10px] text-muted-foreground"><Sparkles size={9} className="inline mr-1" />Missing evidence: {clause.label}</p>)}</div></article>)}</div></section>;
}
