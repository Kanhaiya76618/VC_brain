'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { LayoutDashboard, AlertTriangle, Loader2, Link2, Lightbulb, Download, Mail, CheckCircle } from 'lucide-react';
import { getSupervisorReport, downloadReportPdf, emailReport, type SupervisorReport } from '@/lib/api';
import { getStudentId } from '@/lib/studentId';

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
};

function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}
    >
      <AlertTriangle size={12} className="text-[#dc2626] shrink-0 mt-0.5" />
      <p className="text-[11px] text-[#dc2626] leading-relaxed">{message}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [report, setReport] = useState<SupervisorReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const runCheck = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await getSupervisorReport(getStudentId()));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const blob = await downloadReportPdf(getStudentId());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'researchos-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : String(err));
    } finally {
      setPdfLoading(false);
    }
  };

  const sendEmail = async () => {
    if (emailLoading || !email.trim()) return;
    setEmailLoading(true);
    setEmailError(null);
    setEmailSent(false);
    try {
      await emailReport(getStudentId(), email.trim());
      setEmailSent(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <AppShell topic="Supervisor Dashboard" agentStatus={loading || pdfLoading || emailLoading ? 'running' : 'idle'}>
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={16} className="text-[#4f46e5]" />
            <h1 className="text-lg font-bold text-[#1d1d1f]">Supervisor Dashboard</h1>
          </div>
          <button
            onClick={runCheck}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {loading ? 'Reviewing…' : 'Run supervisor check'}
          </button>
        </div>

        {error && <InlineError message={error} />}

        {!report && !loading && !error && (
          <div className="rounded-2xl p-6 text-center mt-2" style={glass}>
            <LayoutDashboard size={20} className="text-[#4f46e5] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1d1d1f] mb-1">No report yet</p>
            <p className="text-xs text-[#6e6e73] max-w-sm mx-auto leading-relaxed">
              Run a check once you&apos;ve used at least two modules — the Supervisor cross-references
              your learning paths, draft critiques, and archived experiments as a whole.
            </p>
          </div>
        )}

        <AnimatePresence>
          {report && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-4 mt-2"
            >
              {/* Narrative */}
              <div
                className="rounded-2xl p-5"
                style={{
                  ...glass,
                  background: 'rgba(79,70,229,0.06)',
                  border: '1px solid rgba(79,70,229,0.18)',
                }}
              >
                <p className="eyebrow mb-2">From your supervisor</p>
                <p className="text-sm text-[#1d1d1f] leading-relaxed">{report.overallNarrative}</p>
                <p className="text-[9px] font-mono text-[#6e6e73] mt-3">
                  Generated {new Date(report.generatedAt).toLocaleString()}
                </p>
              </div>

              {/* Consistency notes — the cross-module payoff */}
              <div className="rounded-2xl p-4" style={{ ...glass, borderLeft: '4px solid #d97706' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Link2 size={13} className="text-[#d97706]" />
                  <span className="text-xs font-bold text-[#1d1d1f]">Cross-module consistency</span>
                </div>
                {report.consistencyNotes.length > 0 ? (
                  <ul className="space-y-1.5">
                    {report.consistencyNotes.map((n, i) => (
                      <li key={i} className="text-xs text-[#3d3d3f] leading-relaxed flex gap-2">
                        <span className="text-[#d97706] font-bold shrink-0">•</span>
                        {n}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#6e6e73]">Nothing to cross-reference yet.</p>
                )}
              </div>

              {/* Suggestions */}
              <div className="rounded-2xl p-4" style={glass}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb size={13} className="text-[#0d9488]" />
                  <span className="text-xs font-bold text-[#1d1d1f]">Suggested next steps</span>
                </div>
                {report.suggestions.length > 0 ? (
                  <ul className="space-y-1.5">
                    {report.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-[#3d3d3f] leading-relaxed flex gap-2">
                        <span className="text-[#0d9488] font-bold shrink-0">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#6e6e73]">No suggestions recorded.</p>
                )}
              </div>

              {/* Export */}
              <div className="rounded-2xl p-4" style={glass}>
                <p className="eyebrow mb-3">Export</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={downloadPdf}
                    disabled={pdfLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98]"
                    style={{ background: '#1d1d1f' }}
                  >
                    {pdfLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    {pdfLoading ? 'Rendering…' : 'Download PDF'}
                  </button>

                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      aria-label="Email address for the report"
                      className="flex-1 min-w-0 text-xs rounded-xl p-2.5 bg-black/4 border border-black/8 outline-none focus:ring-1 focus:ring-[#4f46e5]/40 text-[#1d1d1f] placeholder:text-[#9a9a9e]"
                      disabled={emailLoading}
                    />
                    <button
                      onClick={sendEmail}
                      disabled={emailLoading || !email.trim()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98] shrink-0"
                      style={{ background: '#4f46e5' }}
                    >
                      {emailLoading ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                      {emailLoading ? 'Sending…' : 'Email me this'}
                    </button>
                  </div>
                </div>

                {emailSent && (
                  <p className="flex items-center gap-1.5 text-[11px] text-[#0d9488] font-medium mt-2" role="status">
                    <CheckCircle size={11} /> Sent — check your inbox.
                  </p>
                )}
                {pdfError && <InlineError message={pdfError} />}
                {emailError && <InlineError message={emailError} />}

                <p className="text-[10px] text-[#9a9a9e] mt-3 leading-relaxed">
                  Note: without a verified sending domain, delivery only works to the email the Resend
                  account is registered with.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
