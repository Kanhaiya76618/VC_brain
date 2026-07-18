import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type {
  AxisScore,
  CapabilitySprint,
  Contradiction,
  FounderScoreSnapshot,
  Memo,
  RoutingDecision,
  StageTransition,
  TraceEvent,
  Validation,
} from '../schema';

// The dossier is the "show me everything" export: every claim with its trust
// math and four timestamps, every contradiction with both quotes, every axis
// subscore with its rationale, founder evidence, sprint results, the stage
// timeline and the agentic trace. The memo argues; the dossier proves.

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 40, paddingBottom: 56, color: '#1d1d1f' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  meta: { fontSize: 8, color: '#6e6e73', marginBottom: 14 },
  h2: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 5 },
  h3: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 3 },
  body: { lineHeight: 1.45, marginBottom: 2 },
  small: { fontSize: 7.5, color: '#6e6e73', lineHeight: 1.4 },
  quote: { fontSize: 8.5, color: '#3d3d3f', fontStyle: 'italic', marginTop: 1 },
  card: {
    border: '0.5 solid #d9d9de',
    borderRadius: 4,
    padding: 7,
    marginBottom: 5,
  },
  dangerCard: {
    border: '0.5 solid #dc2626',
    borderRadius: 4,
    padding: 7,
    marginBottom: 5,
    backgroundColor: '#fdf2f2',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  bandVerified: { color: '#0d9488', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  bandCorroborated: { color: '#4f46e5', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  bandFounder: { color: '#b45309', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  bandWeak: { color: '#dc2626', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#9a9a9e',
    textAlign: 'center',
  },
});

export interface DossierClaim {
  claim_id: string;
  predicate: string;
  value_json: unknown;
  unit: string | null;
  basis: string | null;
  source: { locator: string; verbatim_quote: string };
  derivation: { calculation: string } | null;
  valid_at: string | null;
  published_at: string | null;
  fetched_at: string;
  assessment: {
    trust: number;
    band: string;
    provenance: number;
    directness: number;
    reliability: number;
    recency: number;
    agreement: number;
    conflict_penalty: number;
  } | null;
  validations: Validation[];
  artifact: { title: string; synthetic: boolean; stub: boolean } | null;
}

export interface DossierPerson {
  canonical_name: string;
  founder_score: FounderScoreSnapshot;
  sprints: CapabilitySprint[];
}

function bandStyle(band: string | undefined) {
  if (band === 'verified') return styles.bandVerified;
  if (band === 'corroborated') return styles.bandCorroborated;
  if (band === 'weak_or_disputed') return styles.bandWeak;
  return styles.bandFounder;
}

function fmtValue(c: DossierClaim): string {
  const v = typeof c.value_json === 'number' ? c.value_json.toLocaleString('en-US') : String(c.value_json);
  return `${v}${c.unit ? ` ${c.unit}` : ''}${c.basis ? ` [${c.basis}]` : ''}`;
}

export function DossierDocument({
  companyName,
  domain,
  generatedAt,
  routing,
  axes,
  contradictions,
  claims,
  persons,
  memo,
  transitions,
  traceEvents,
}: {
  companyName: string;
  domain: string | null;
  generatedAt: string;
  routing: RoutingDecision | null;
  axes: AxisScore[];
  contradictions: Contradiction[];
  claims: DossierClaim[];
  persons: DossierPerson[];
  memo: Memo | null;
  transitions: StageTransition[];
  traceEvents: TraceEvent[];
}) {
  const synthetic = claims.some((c) => c.artifact?.synthetic);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Diligence dossier — {companyName}</Text>
        <Text style={styles.meta}>
          {domain ? `${domain} · ` : ''}generated {generatedAt}
          {synthetic ? ' · CONTAINS CLEARLY-LABELED SYNTHETIC DEMO DATA' : ''} · every number below traces to a
          quoted source or a shown calculation
        </Text>

        {/* Recommendation */}
        <Text style={styles.h2}>Recommendation — the system proposes, a human decides</Text>
        {routing ? (
          <View style={routing.route === 'hold' ? styles.dangerCard : styles.card}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10 }}>
              {routing.route === 'hold' ? 'HOLD FOR HUMAN REVIEW' : routing.route.replace(/_/g, ' ').toUpperCase()}
            </Text>
            <Text style={styles.body}>{routing.matrix_rule}</Text>
            {routing.proposed_check && <Text style={styles.body}>{routing.proposed_check}</Text>}
            <Text style={styles.small}>decided at {routing.decided_at}</Text>
          </View>
        ) : (
          <Text style={styles.small}>No routing decision yet — diligence has not completed.</Text>
        )}

        {/* Axes */}
        <Text style={styles.h2}>Screening axes — three independent scores, never averaged</Text>
        {axes.map((a) => (
          <View key={a.axis} style={styles.card} wrap={false}>
            <View style={styles.row}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{a.axis.replace('_', ' vs ')}</Text>
              <Text>
                {a.score === null
                  ? `not enough evidence (coverage ${a.coverage.toFixed(2)})`
                  : `${a.score}/100 · coverage ${a.coverage.toFixed(2)} · band ${a.band[0]}–${a.band[1]} · ${a.trend.replace('_', ' ')}${a.market_label ? ` · ${a.market_label.toUpperCase()}` : ''}`}
              </Text>
            </View>
            {a.subscores.map((s) => (
              <Text key={s.name} style={styles.small}>
                • {s.name.replace(/_/g, ' ')} (w {Math.round(s.weight * 100)}%):{' '}
                {s.value === null ? 'no evidence — excluded, not zero' : s.value} — {s.rationale}
              </Text>
            ))}
          </View>
        ))}

        {/* Contradictions */}
        <Text style={styles.h2}>Contradictions — preserved, never reconciled away ({contradictions.length})</Text>
        {contradictions.length === 0 && <Text style={styles.small}>None detected.</Text>}
        {contradictions.map((c) => (
          <View key={c.contradiction_id} style={styles.dangerCard} wrap={false}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: '#dc2626', fontSize: 8.5 }}>
              {c.severity.toUpperCase()} · {c.rule} · domain: {c.domain} · {c.rule_version}
            </Text>
            <Text style={styles.body}>{c.detail}</Text>
            {c.llm_reconciliation_note && (
              <Text style={styles.small}>Possible reconciliation (flag retained): {c.llm_reconciliation_note}</Text>
            )}
          </View>
        ))}

        {/* Founders */}
        <Text style={styles.h2}>Founders — persistent scores that follow the person</Text>
        {persons.map((p) => {
          const fs = p.founder_score;
          const sprint = p.sprints[p.sprints.length - 1];
          return (
            <View key={p.canonical_name} style={styles.card} wrap={false}>
              <View style={styles.row}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>{p.canonical_name}</Text>
                <Text>
                  {fs.total === null
                    ? `not enough evidence (coverage ${fs.coverage.toFixed(2)} — neutral, never adverse)`
                    : `${fs.total}/100 · coverage ${fs.coverage.toFixed(2)} · band ${fs.band[0]}–${fs.band[1]}`}
                </Text>
              </View>
              {Object.entries(fs.components)
                .filter(([, comp]) => comp.evidence_count > 0)
                .map(([name, comp]) => (
                  <Text key={name} style={styles.small}>
                    • {name.replace(/_/g, ' ')}: {comp.value} (weight {comp.weight}, {comp.evidence_count} evidence event
                    {comp.evidence_count === 1 ? '' : 's'})
                  </Text>
                ))}
              {sprint && (
                <View style={{ marginTop: 3 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0d9488' }}>
                    Blind Capability Sprint {sprint.blind_id}: {sprint.total}/100 ({sprint.rubric_version}
                    {sprint.simulated ? ', simulated demo' : ''})
                  </Text>
                  {Object.entries(sprint.components).map(([k, comp]) => (
                    <Text key={k} style={styles.small}>
                      • {k.replace(/_/g, ' ')}: {comp.score}/{comp.max} — {comp.note}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Evidence appendix */}
        <Text style={styles.h2} break>
          Evidence appendix — every claim, its trust math, its four timestamps ({claims.length})
        </Text>
        {claims.map((c) => (
          <View key={c.claim_id} style={styles.card} wrap={false}>
            <View style={styles.row}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8.5 }}>
                {c.predicate} = {fmtValue(c)}
                {c.artifact?.synthetic ? '  [SYNTHETIC]' : ''}
                {c.artifact?.stub ? '  [STUB]' : ''}
              </Text>
              <Text style={bandStyle(c.assessment?.band)}>
                {c.assessment ? `trust ${c.assessment.trust} · ${c.assessment.band.replace(/_/g, ' ')}` : 'unassessed'}
              </Text>
            </View>
            <Text style={styles.quote}>
              “{c.source.verbatim_quote}” — {c.artifact?.title ?? 'source'} · {c.source.locator}
            </Text>
            {c.derivation && <Text style={styles.small}>Derived: {c.derivation.calculation}</Text>}
            {c.assessment && (
              <Text style={styles.small}>
                trust = 30×{c.assessment.provenance} prov + 25×{c.assessment.directness} direct + 20×
                {c.assessment.reliability} reliab + 15×{c.assessment.recency} recency + 10×{c.assessment.agreement}{' '}
                agree − {c.assessment.conflict_penalty} conflict
              </Text>
            )}
            <Text style={styles.small}>
              event {c.valid_at ?? '—'} · published {c.published_at?.slice(0, 10) ?? '—'} · fetched{' '}
              {c.fetched_at.slice(0, 10)} · validated{' '}
              {c.validations.length ? c.validations[c.validations.length - 1].validated_at.slice(0, 10) : '—'}
            </Text>
            {c.validations.map((v) => (
              <Text key={v.validation_id} style={styles.small}>
                Validator [{v.method}]: {v.verdict.replace(/_/g, ' ')}
                {v.shown_calculation ? ` — ${v.shown_calculation}` : ''}
              </Text>
            ))}
          </View>
        ))}

        {/* Missing data */}
        {memo && memo.missing.length > 0 && (
          <View>
            <Text style={styles.h2}>Not disclosed / unavailable — flagged, never fabricated</Text>
            {memo.missing.map((m, i) => (
              <Text key={i} style={[styles.body, { color: '#b45309' }]}>
                • {m}
              </Text>
            ))}
          </View>
        )}

        {/* Timeline + trace */}
        <Text style={styles.h2}>Stage timeline — time-to-decision instrumentation</Text>
        <Text style={styles.body}>
          {transitions.map((t) => `${t.to} (${t.at.slice(5, 16).replace('T', ' ')} · ${t.actor})`).join('  →  ')}
        </Text>

        <Text style={styles.h2}>Agentic trace — actions and evidence, reproducible ({traceEvents.length} events)</Text>
        {traceEvents.slice(-40).map((t) => (
          <Text key={t.trace_id} style={styles.small}>
            {t.at.slice(11, 19)} · {t.agent} · {t.action} · {t.output_refs.length} refs · {t.rule_version}
          </Text>
        ))}

        <Text style={styles.footer} fixed>
          VC Brain diligence dossier · generated from the append-only evidence graph · contradictions preserved ·
          missing data flagged, never fabricated
        </Text>
      </Page>
    </Document>
  );
}
