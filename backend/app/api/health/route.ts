import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { callClaudeJSON, getLastUsedModel } from '@/lib/llm';

const AGENTS = [
  'curriculumAgent',
  'criticAgent',
  'archivistAgent',
  'plannerAgent',
  'supervisorAgent',
  'notifyAgent',
  'reviewerAgent',
  'panelAgent',
  'sentinelAgent',
];

export async function GET() {
  let dataDirWritable = false;
  try {
    const probe = path.join(process.cwd(), 'data', '.healthcheck');
    fs.mkdirSync(path.dirname(probe), { recursive: true });
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    dataDirWritable = true;
  } catch {
    dataDirWritable = false;
  }

  return NextResponse.json({
    ok: true,
    agents: AGENTS,
    env: {
      llmKey: Boolean(process.env.LLM_API_KEY),
      fallbackKey: Boolean(process.env.LLM_FALLBACK_API_KEY),
      resendKey: Boolean(process.env.RESEND_API_KEY),
      s2Key: Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY),
    },
    dataDirWritable,
  });
}

export async function POST() {
  try {
    await callClaudeJSON<{ ok: boolean }>({
      system: 'Respond ONLY with JSON: {"ok": true}',
      user: 'ping',
      maxTokens: 50,
    });
    return NextResponse.json({ selftest: 'pass', model: getLastUsedModel() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ selftest: 'fail', error: message }, { status: 500 });
  }
}
