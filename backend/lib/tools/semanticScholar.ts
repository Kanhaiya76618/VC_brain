import fs from 'fs';
import path from 'path';

export interface CitedReference {
  title: string;
  year: number | null;
  arxivId: string | null;
  abstract: string | null;
}

interface S2Reference {
  title?: string;
  year?: number;
  abstract?: string;
  externalIds?: { ArXiv?: string };
}

const CACHE_PATH = path.join(process.cwd(), 'data', 's2-cache.json');

type Cache = Record<string, CitedReference[]>;

function readCache(): Cache {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) as Cache;
  } catch {
    return {};
  }
}

function writeCache(cache: Cache): void {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchReferences(arxivId: string, limit = 10): Promise<CitedReference[]> {
  const cache = readCache();
  const cached = cache[arxivId];
  if (cached) return cached.slice(0, limit);

  const url =
    `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}` +
    `?fields=references.title,references.year,references.externalIds,references.abstract`;
  const headers: Record<string, string> = {};
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;

  let res: Response | undefined;
  for (let attempt = 0; attempt <= 3; attempt++) {
    res = await fetch(url, { headers });
    if (res.status !== 429) break;
    if (attempt < 3) await sleep(2000 * 2 ** attempt + Math.random() * 1000);
  }
  if (!res || !res.ok) {
    throw new Error(`Semantic Scholar API returned ${res?.status ?? 'no response'} for arXiv:${arxivId}`);
  }

  const data = (await res.json()) as { references?: S2Reference[] };
  const refs = (data.references ?? [])
    .filter((r) => r.abstract)
    .slice(0, limit)
    .map((r) => ({
      title: r.title ?? '',
      year: r.year ?? null,
      arxivId: r.externalIds?.ArXiv ?? null,
      abstract: r.abstract ?? null,
    }));

  cache[arxivId] = refs;
  writeCache(cache);
  return refs;
}
