import { createElement, type ReactElement } from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { collectClaims, opportunityView } from '../pipeline';
import { MemoDocument } from './MemoDocument';

export async function buildMemoPdf(opportunityId: string): Promise<Buffer> {
  const view = opportunityView(opportunityId);
  if (!view) throw new Error(`Unknown opportunity: ${opportunityId}`);
  if (!view.memo) throw new Error('No memo has been generated for this opportunity yet.');
  return renderToBuffer(
    // renderToBuffer expects ReactElement<DocumentProps>; our component's props don't match structurally
    createElement(MemoDocument, {
      companyName: view.company?.canonical_name ?? 'Unknown company',
      memo: view.memo,
      claims: collectClaims(opportunityId),
      axes: view.axes,
      contradictions: view.contradictions,
    }) as unknown as ReactElement<DocumentProps>
  );
}
