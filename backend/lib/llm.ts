interface CallArgs {
  system: string;
  user: string;
  maxTokens?: number;
  tier?: 'heavy';
}

let lastUsedModel: string | null = null;

/** The model that served the most recent successful call (primary or fallback). */
export function getLastUsedModel(): string | null {
  return lastUsedModel;
}

async function chatOnce(
  baseUrl: string,
  apiKey: string,
  model: string,
  { system, user, maxTokens = 2000 }: CallArgs
): Promise<string> {
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const snippet = (await res.text()).slice(0, 300);
    throw new Error(`LLM API ${res.status} from ${baseUrl}: ${snippet}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('LLM response contained no message content');
  }
  return content;
}

export async function callClaude(args: CallArgs): Promise<string> {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model =
    args.tier === 'heavy' && process.env.LLM_MODEL_HEAVY
      ? process.env.LLM_MODEL_HEAVY
      : process.env.LLM_MODEL;
  if (!baseUrl || !apiKey || !model) {
    throw new Error('LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL must be set');
  }

  try {
    const out = await chatOnce(baseUrl, apiKey, model, args);
    lastUsedModel = model;
    return out;
  } catch (err) {
    const fbUrl = process.env.LLM_FALLBACK_BASE_URL;
    const fbKey = process.env.LLM_FALLBACK_API_KEY;
    const fbModel = process.env.LLM_FALLBACK_MODEL;
    if (fbUrl && fbKey && fbModel) {
      const reason = err instanceof Error ? err.message.slice(0, 120) : String(err);
      console.warn(`[llm] primary failed, using fallback: ${reason}`);
      const out = await chatOnce(fbUrl, fbKey, fbModel, args);
      lastUsedModel = fbModel;
      return out;
    }
    throw err;
  }
}

function stripFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

export async function callClaudeJSON<T>(args: CallArgs): Promise<T> {
  const raw = await callClaude(args);
  try {
    return JSON.parse(stripFences(raw)) as T;
  } catch (err) {
    // Single Sentinel repair pass — no retry loops.
    const parseError = err instanceof Error ? err.message : String(err);
    const { repairJSON } = await import('./agents/sentinelAgent');
    const repaired = await repairJSON(raw, parseError);
    try {
      const parsed = JSON.parse(stripFences(repaired)) as T;
      console.warn('[sentinel] repaired malformed JSON');
      return parsed;
    } catch {
      throw new Error(
        `Failed to parse JSON from LLM output. Raw output:\n${raw}\n\nSentinel repair attempt:\n${repaired}`
      );
    }
  }
}
