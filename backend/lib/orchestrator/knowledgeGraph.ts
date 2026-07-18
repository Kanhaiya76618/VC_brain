import fs from 'fs';
import path from 'path';
import type { LearningPath } from '../agents/curriculumAgent';
import type { DraftCritique } from '../agents/criticAgent';
import type { ArchiveEntry } from '../agents/archivistAgent';
import type { ExperimentPlan } from '../agents/plannerAgent';
import type { ReviewGrade } from '../agents/reviewerAgent';
import type { PanelVerdict } from '../agents/panelAgent';

const DB_PATH = path.join(process.cwd(), 'data', 'knowledge-graph.json');

export interface StudentRecord {
  studentId: string;
  learningPaths: LearningPath[];
  critiques: DraftCritique[];
  archiveEntries: ArchiveEntry[];
  plans: ExperimentPlan[];
  reviewGrades: ReviewGrade[];
  panelVerdicts: PanelVerdict[];
}

type Db = Record<string, StudentRecord>;

function readDb(): Db {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as Db;
  } catch {
    return {};
  }
}

function writeDb(db: Db): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getOrCreate(db: Db, studentId: string): StudentRecord {
  const rec =
    db[studentId] ??
    { studentId, learningPaths: [], critiques: [], archiveEntries: [], plans: [], reviewGrades: [], panelVerdicts: [] };
  // records written before these fields existed lack them
  rec.archiveEntries ??= [];
  rec.plans ??= [];
  rec.reviewGrades ??= [];
  rec.panelVerdicts ??= [];
  db[studentId] = rec;
  return rec;
}

export function recordLearningPath(studentId: string, lp: any): void {
  const db = readDb();
  getOrCreate(db, studentId).learningPaths.push(lp);
  writeDb(db);
}

export function recordCritique(studentId: string, c: any): void {
  const db = readDb();
  getOrCreate(db, studentId).critiques.push(c);
  writeDb(db);
}

export function recordPlan(studentId: string, plan: any): void {
  const db = readDb();
  getOrCreate(db, studentId).plans.push(plan);
  writeDb(db);
}

export function recordReviewGrade(studentId: string, g: any): void {
  const db = readDb();
  getOrCreate(db, studentId).reviewGrades.push(g);
  writeDb(db);
}

export function recordPanelVerdict(studentId: string, v: any): void {
  const db = readDb();
  getOrCreate(db, studentId).panelVerdicts.push(v);
  writeDb(db);
}

export function recordArchiveEntry(studentId: string, e: any): void {
  const db = readDb();
  getOrCreate(db, studentId).archiveEntries.push(e);
  writeDb(db);
}

export function getFullStudentRecord(studentId: string): StudentRecord {
  return getOrCreate(readDb(), studentId);
}

export function getStudentContext(studentId: string): string {
  const rec = getFullStudentRecord(studentId);
  const titles = rec.learningPaths
    .flatMap((lp: any) => lp?.nodes ?? [])
    .map((n: any) => n?.title)
    .filter((t: unknown): t is string => typeof t === 'string' && t.length > 0)
    .slice(0, 12);
  const attempted = rec.archiveEntries
    .map((e: any) => e?.attempted)
    .filter((a: unknown): a is string => typeof a === 'string' && a.length > 0)
    .slice(0, 8);
  if (rec.learningPaths.length === 0 && titles.length === 0 && attempted.length === 0) {
    return 'No prior activity on record.';
  }
  const parts = [`Papers studied: ${rec.learningPaths.length}.`];
  if (titles.length) parts.push(`Known topics: ${titles.join('; ')}.`);
  if (rec.archiveEntries.length) {
    parts.push(`Logged ${rec.archiveEntries.length} failed experiment(s): ${attempted.join('; ')}.`);
  }
  return parts.join(' ');
}
