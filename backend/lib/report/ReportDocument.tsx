import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { StudentRecord } from '../orchestrator/knowledgeGraph';
import type { SupervisorReport } from '../agents/supervisorAgent';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 40, paddingBottom: 56, color: '#1d1d1f' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  meta: { fontSize: 8, color: '#6e6e73', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 4 },
  body: { lineHeight: 1.5 },
  bullet: { flexDirection: 'row', marginBottom: 2 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1, lineHeight: 1.4 },
  itemTitle: { fontFamily: 'Helvetica-Bold', marginTop: 6 },
  subtle: { color: '#6e6e73' },
  empty: { color: '#6e6e73', fontStyle: 'italic' },
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

function Bullets({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <Text style={styles.empty}>{empty}</Text>;
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function ReportDocument({
  record,
  supervisor,
}: {
  record: StudentRecord;
  supervisor: SupervisorReport;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Research Apprenticeship Summary</Text>
        <Text style={styles.meta}>
          Student: {record.studentId} · Generated: {supervisor.generatedAt}
        </Text>

        <Text style={styles.sectionTitle}>Supervisor summary</Text>
        <Text style={styles.body}>{supervisor.overallNarrative}</Text>

        <Text style={styles.sectionTitle}>Consistency notes</Text>
        <Bullets items={supervisor.consistencyNotes} empty="None recorded." />

        <Text style={styles.sectionTitle}>Suggested next steps</Text>
        <Bullets items={supervisor.suggestions} empty="None recorded." />

        <Text style={styles.sectionTitle}>PaperTrail — learning paths</Text>
        {record.learningPaths.length === 0 ? (
          <Text style={styles.empty}>None yet.</Text>
        ) : (
          record.learningPaths.map((lp, i) => (
            <View key={i}>
              <Text style={styles.itemTitle}>{lp.targetTitle}</Text>
              <Text style={styles.subtle}>{lp.nodes.map((n) => n.title).join(' → ')}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>FirstPaper — draft critiques</Text>
        {record.critiques.length === 0 ? (
          <Text style={styles.empty}>None yet.</Text>
        ) : (
          record.critiques.map((c, i) => (
            <View key={i}>
              <Text style={styles.itemTitle}>{c.structureSummary}</Text>
              <Bullets
                items={c.flags.map((f) => `[${f.type} · ${f.severity}] ${f.note}`)}
                empty="No flags."
              />
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Archive — negative results</Text>
        {record.archiveEntries.length === 0 ? (
          <Text style={styles.empty}>None yet.</Text>
        ) : (
          record.archiveEntries.map((e, i) => (
            <View key={i}>
              <Text style={styles.itemTitle}>{e.attempted}</Text>
              <Text style={styles.body}>
                Failure mode: {e.failureMode}. Lesson: {e.lesson}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.footer} fixed>
          ResearchOS · generated automatically from the student knowledge graph
        </Text>
      </Page>
    </Document>
  );
}
