import { XMLParser } from 'fast-xml-parser';

export interface ArxivPaper {
  arxivId: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  url: string;
}

export function extractArxivId(idOrUrl: string): string {
  let s = idOrUrl.trim();
  const urlMatch = s.match(/arxiv\.org\/(?:abs|pdf)\/([^?#\s]+)/i);
  if (urlMatch) s = urlMatch[1];
  return s
    .replace(/^arxiv:/i, '')
    .replace(/\.pdf$/i, '')
    .replace(/v\d+$/i, '');
}

export async function fetchArxivPaper(idOrUrl: string): Promise<ArxivPaper> {
  const id = extractArxivId(idOrUrl);
  const res = await fetch(`http://export.arxiv.org/api/query?id_list=${id}`);
  if (!res.ok) throw new Error(`arXiv API returned ${res.status} for id "${id}"`);
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(await res.text());
  let entry = parsed?.feed?.entry;
  if (Array.isArray(entry)) entry = entry[0];
  if (!entry?.title) throw new Error(`No arXiv entry found for id "${id}"`);
  const clean = (t: unknown) => String(t).replace(/\s+/g, ' ').trim();
  const authors = entry.author ? (Array.isArray(entry.author) ? entry.author : [entry.author]) : [];
  return {
    arxivId: id,
    title: clean(entry.title),
    summary: clean(entry.summary),
    authors: authors.map((a: { name: string }) => a.name),
    published: String(entry.published ?? ''),
    url: `https://arxiv.org/abs/${id}`,
  };
}
