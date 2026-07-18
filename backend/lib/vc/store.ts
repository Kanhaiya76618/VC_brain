import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data', 'vc');
const PAYLOAD_DIR = path.join(DATA_DIR, 'payloads');

export type TableName =
  | 'persons'
  | 'companies'
  | 'external_identities'
  | 'artifacts'
  | 'claims'
  | 'evidence_assessments'
  | 'validations'
  | 'contradictions'
  | 'relationships'
  | 'merge_candidates'
  | 'opportunities'
  | 'stage_transitions'
  | 'trace_events'
  | 'founder_score_events'
  | 'axis_scores'
  | 'theses'
  | 'leads'
  | 'scout_signals'
  | 'outreach_drafts'
  | 'memos'
  | 'routing_decisions';

const ALL_TABLES: TableName[] = [
  'persons',
  'companies',
  'external_identities',
  'artifacts',
  'claims',
  'evidence_assessments',
  'validations',
  'contradictions',
  'relationships',
  'merge_candidates',
  'opportunities',
  'stage_transitions',
  'trace_events',
  'founder_score_events',
  'axis_scores',
  'theses',
  'leads',
  'scout_signals',
  'outreach_drafts',
  'memos',
  'routing_decisions',
];

function tableFile(table: TableName): string {
  return path.join(DATA_DIR, `${table}.json`);
}

export function all<T>(table: TableName): T[] {
  try {
    return JSON.parse(fs.readFileSync(tableFile(table), 'utf8')) as T[];
  } catch {
    return [];
  }
}

// The only write primitive. There is deliberately no update-in-place:
// corrections append a new row with `supersedes` set.
export function append<T extends object>(table: TableName, row: T): T {
  const rows = all<T>(table);
  const stamped = { ...row, _created_at: new Date().toISOString() };
  rows.push(stamped);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(tableFile(table), JSON.stringify(rows, null, 2));
  return stamped;
}

export function where<T>(table: TableName, pred: (row: T) => boolean): T[] {
  return all<T>(table).filter(pred);
}

export function find<T>(table: TableName, pred: (row: T) => boolean): T | undefined {
  return all<T>(table).find(pred);
}

export function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
}

export function now(): string {
  return new Date().toISOString();
}

export function sha256(payload: string): string {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function archivePayload(artifactId: string, payload: string): string {
  fs.mkdirSync(PAYLOAD_DIR, { recursive: true });
  const p = path.join(PAYLOAD_DIR, `${artifactId}.txt`);
  fs.writeFileSync(p, payload);
  return path.relative(process.cwd(), p);
}

export function readPayload(payloadPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), payloadPath), 'utf8');
}

// Demo-only: wipes the whole graph so the seed script can run from a clean
// slate. Not exposed anywhere except the seed endpoint.
export function resetAllTables(): void {
  for (const t of ALL_TABLES) {
    try {
      fs.rmSync(tableFile(t));
    } catch {
      /* table did not exist */
    }
  }
  try {
    fs.rmSync(PAYLOAD_DIR, { recursive: true });
  } catch {
    /* no payloads yet */
  }
}
