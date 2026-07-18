import { NextResponse } from 'next/server';
import { ensureCompany, upsertArtifact } from '@/lib/vc/cartographer';
import { createOpportunity, transition } from '@/lib/vc/orchestrator';
import { extractClaims } from '@/lib/vc/agents/extractor';

// Inbound application — the brief's minimum bar: deck + company name.
// The pasted deck becomes a real artifact and flows into the same screening
// funnel as outbound leads. Nothing about it is synthetic or pre-seeded.
export async function POST(request: Request) {
  try {
    const { companyName, domain, deckText } = await request.json();
    if (typeof companyName !== 'string' || !companyName.trim()) {
      return NextResponse.json({ error: '"companyName" is required.' }, { status: 400 });
    }
    if (typeof deckText !== 'string' || deckText.trim().length < 80) {
      return NextResponse.json(
        { error: '"deckText" is required (paste the deck content — at least a few sentences).' },
        { status: 400 }
      );
    }

    const company = ensureCompany(companyName.trim(), typeof domain === 'string' && domain.trim() ? domain.trim() : null);
    const artifact = upsertArtifact({
      company_id: company.company_id,
      source: 'deck',
      kind: 'pitch_deck',
      url: null,
      title: `${companyName.trim()} — inbound application deck`,
      payload: deckText,
      published_at: new Date().toISOString(),
      synthetic: false,
      stub: false,
    });

    const opp = createOpportunity(company.company_id, 'inbound');
    transition(opp.opportunity_id, 'ingested', 'human');
    await extractClaims(artifact, company.company_id, opp.opportunity_id);

    return NextResponse.json({ opportunity_id: opp.opportunity_id, company_id: company.company_id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
