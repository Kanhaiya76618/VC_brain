import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { AxisScore, Claim, Contradiction, Memo } from '../schema';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 40, paddingBottom: 56, color: '#1d1d1f' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  meta: { fontSize: 8, color: '#6e6e73', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 4 },
  body: { lineHeight: 1.5, marginBottom: 3 },
  chip: { fontSize: 7.5, color: '#4f46e5', marginBottom: 6, marginLeft: 8 },
  subtle: { color: '#6e6e73' },
  warn: { color: '#b45309' },
  danger: { color: '#dc2626' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  axisName: { fontFamily: 'Helvetica-Bold' },
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

function chipText(claimIds: string[], claimMap: Map<string, Claim>): string {
  const parts = claimIds
    .map((cid) => claimMap.get(cid))
    .filter((c): c is Claim => !!c)
    .map((c) => `${c.source.locator}: "${c.source.verbatim_quote.slice(0, 90)}"`);
  return parts.join('  ·  ');
}

export function MemoDocument({
  companyName,
  memo,
  claims,
  axes,
  contradictions,
}: {
  companyName: string;
  memo: Memo;
  claims: Claim[];
  axes: AxisScore[];
  contradictions: Contradiction[];
}) {
  const claimMap = new Map(claims.map((c) => [c.claim_id, c]));
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Investment memo — {companyName}</Text>
        <Text style={styles.meta}>
          Generated {memo.generated_at} · every factual sentence cites its source · contradictions
          preserved, never reconciled
        </Text>

        <Text style={styles.sectionTitle}>Screening axes (independent — never averaged)</Text>
        {axes.map((a) => (
          <View key={a.axis} style={styles.axisRow}>
            <Text style={styles.axisName}>{a.axis.replace('_', ' vs ')}</Text>
            <Text>
              {a.score === null
                ? `not enough evidence (coverage ${a.coverage.toFixed(2)})`
                : `${a.score} / 100 · coverage ${a.coverage.toFixed(2)} · band ${a.band[0]}–${a.band[1]} · trend: ${a.trend.replace('_', ' ')}${a.market_label ? ` · ${a.market_label}` : ''}`}
            </Text>
          </View>
        ))}

        {contradictions.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Open contradictions</Text>
            {contradictions.map((c) => (
              <Text key={c.contradiction_id} style={[styles.body, styles.danger]}>
                [{c.severity} · {c.rule}] {c.detail}
              </Text>
            ))}
          </View>
        )}

        {memo.sections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.sentences.length === 0 ? (
              <Text style={[styles.body, styles.subtle]}>No evidence-backed content.</Text>
            ) : (
              section.sentences.map((s, i) => (
                <View key={i}>
                  <Text style={styles.body}>{s.text}</Text>
                  {s.claim_ids.length > 0 && (
                    <Text style={styles.chip}>{chipText(s.claim_ids, claimMap)}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Investment hypotheses — with falsifiers</Text>
        {memo.hypotheses.map((h, i) => (
          <View key={i}>
            <Text style={styles.body}>
              {i + 1}. {h.statement}
            </Text>
            <Text style={[styles.chip, styles.warn]}>Falsifier: {h.falsifier}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Not disclosed / unavailable</Text>
        {memo.missing.length === 0 ? (
          <Text style={[styles.body, styles.subtle]}>Nothing outstanding.</Text>
        ) : (
          memo.missing.map((m, i) => (
            <Text key={i} style={[styles.body, styles.warn]}>
              {m}
            </Text>
          ))
        )}

        <Text style={styles.footer} fixed>
          VC Brain · generated from the append-only evidence graph · missing data is flagged, never
          fabricated
        </Text>
      </Page>
    </Document>
  );
}
