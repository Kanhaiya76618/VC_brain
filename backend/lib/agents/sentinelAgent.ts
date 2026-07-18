import { callClaude } from '../llm';

const SYSTEM = `You receive text that was supposed to be valid JSON but failed to parse, plus the parse error. Output ONLY the corrected JSON — no fences, no commentary, and no schema changes beyond what fixes the syntax (unterminated strings, trailing commas, stray text before or after the object). Preserve all content.`;

export async function repairJSON(raw: string, parseError: string): Promise<string> {
  return callClaude({
    system: SYSTEM,
    user: `PARSE ERROR: ${parseError}\n\nRAW TEXT:\n${raw}`,
    maxTokens: 3000,
  });
}
