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
    // A provider that hangs (accepts the request, never responds) would
    // otherwise stall the whole agent pipeline — fail fast and let the
    // caller's retry/fallback logic take over.
    signal: AbortSignal.timeout(90_000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0,
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

  let lastErr: unknown;
  for (const delayMs of [0, 2000, 6000]) {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const out = await chatOnce(baseUrl, apiKey, model, args);
      lastUsedModel = model;
      return out;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Permanent failures (auth, billing) should not burn retries.
      if (/ 401 | 402 | 403 /.test(` ${msg} `)) break;
      console.warn(`[llm] attempt failed, ${delayMs ? 'after backoff ' : ''}retrying: ${msg.slice(0, 120)}`);
    }
  }
  {
    const err = lastErr;
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
