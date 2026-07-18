import { createElement, type ReactElement } from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { opportunityView, traceView } from '../pipeline';
import { DossierDocument } from './DossierDocument';

// The on-demand full-detail export: unlike the memo (an argument), the
// dossier is the complete evidence record for an opportunity.
export async function buildDossierPdf(opportunityId: string): Promise<Buffer> {
  const view = opportunityView(opportunityId);
  if (!view) throw new Error(`Unknown opportunity: ${opportunityId}`);
  return renderToBuffer(
    // renderToBuffer expects ReactElement<DocumentProps>; our component's props don't match structurally
    createElement(DossierDocument, {
      companyName: view.company?.canonical_name ?? 'Unknown company',
      domain: view.company?.primary_domain ?? null,
      generatedAt: new Date().toISOString(),
      routing: view.routing,
      axes: view.axes,
      contradictions: view.contradictions,
      claims: view.claims,
      persons: view.persons,
      memo: view.memo,
      transitions: view.transitions,
      traceEvents: traceView(opportunityId),
    }) as unknown as ReactElement<DocumentProps>
  );
}
