'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Send } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { applyInbound } from '@/lib/vcApi';

// Inbound application — the brief's minimum bar is deck + company name.
// The pasted deck becomes a real evidence artifact and enters the same
// screening funnel as outbound leads.
export default function ApplyPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [deckText, setDeckText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { opportunity_id } = await applyInbound({
        companyName,
        domain: domain || undefined,
        deckText,
      });
      router.push(`/opportunity/${opportunity_id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setBusy(false);
    }
  };

  return (
    <AppShell topic="Inbound application" agentStatus={busy ? 'running' : 'idle'}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="eyebrow mb-1">Inbound · deck + company name is the minimum bar</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Apply for a decision in 24 hours</h1>
        <p className="text-xs text-muted-foreground mb-6">
          Your deck becomes atomic, source-quoted claims. Every claim is independently verified; missing data
          stays neutral, never adverse. No network required.
        </p>

        <form onSubmit={submit} className="glass rounded-2xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[11px] font-semibold text-foreground">Company name *</span>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-white/80 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/40"
                placeholder="Acme AI"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-foreground">Domain (optional)</span>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-white/80 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/40"
                placeholder="acme.ai"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <FileText size={12} /> Deck content * <span className="font-normal text-muted-foreground">(paste slide text — numbers need units and periods to survive extraction)</span>
            </span>
            <textarea
              value={deckText}
              onChange={(e) => setDeckText(e.target.value)}
              required
              rows={14}
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm font-mono bg-white/80 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/40"
              placeholder={'[slide 1] Acme AI — automated reconciliation for mid-market finance teams. Founded 2026, Amsterdam.\n\n[slide 2] Traction: $12,000 MRR as of June 2026 across 4 paying customers...\n\n[slide 3] Team: ...'}
            />
          </label>
          {error && (
            <div className="critique-contradiction rounded-xl px-4 py-3 text-xs" style={{ color: '#dc2626' }}>
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              Extraction runs on submit (~1 min). You will land on the opportunity page; diligence runs from the pipeline.
            </p>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              <Send size={13} /> {busy ? 'Extracting claims…' : 'Submit application'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
