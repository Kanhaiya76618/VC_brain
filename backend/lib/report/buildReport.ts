import { createElement, type ReactElement } from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { getFullStudentRecord } from '../orchestrator/knowledgeGraph';
import { synthesize, type SupervisorReport } from '../agents/supervisorAgent';
import { ReportDocument } from './ReportDocument';

export async function buildReportPdf(
  studentId: string
): Promise<{ buffer: Buffer; supervisor: SupervisorReport }> {
  const record = getFullStudentRecord(studentId);
  const supervisor = await synthesize(studentId);
  const buffer = await renderToBuffer(
    // renderToBuffer expects ReactElement<DocumentProps>; our component's props don't match structurally
    createElement(ReportDocument, { record, supervisor }) as unknown as ReactElement<DocumentProps>
  );
  return { buffer, supervisor };
}
