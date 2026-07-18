import { all, append, id } from './store';
import type { Lead, Thesis } from './schema';

export interface ThesisInput {
  name: string;
  sectors: string[];
  stages: string[];
  geographies: string[];
  check_size: { min: number; max: number; currency?: string };
  ownership_target: number;
  risk_appetite: 'low' | 'medium' | 'high';
}

export interface ThesisFit {
  score: number; // 0–20, the formation-detector component only
  matched: string[];
  unmatched: string[];
}

const DEFAULT_THESIS: Thesis = {
  thesis_id: 'thesis_default',
  name: 'General early-stage software',
  active: true,
  sectors: [], // empty means broad; a configured sector list is an explicit filter
  stages: ['pre-seed', 'seed'],
  geographies: [],
  check_size: { min: 100_000, max: 1_000_000, currency: 'USD' },
  ownership_target: 10,
  risk_appetite: 'medium',
};

function cleanList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function lower(values: string[]): string[] {
  return values.map((value) => value.toLowerCase());
}

export function activeThesis(): Thesis {
  const rows = all<Thesis>('theses');
  return rows.length ? rows[rows.length - 1] : DEFAULT_THESIS;
}

// Config is append-only: the last record is the active config and prior
// records remain an auditable history of why a ranking changed.
export function saveThesis(input: ThesisInput): Thesis {
  const min = Math.max(0, Math.round(input.check_size.min));
  const max = Math.max(min, Math.round(input.check_size.max));
  return append<Thesis>('theses', {
    thesis_id: id('ths'),
    name: input.name.trim() || 'Untitled thesis',
    active: true,
    sectors: cleanList(input.sectors),
    stages: cleanList(input.stages),
    geographies: cleanList(input.geographies),
    check_size: { min, max, currency: input.check_size.currency?.trim() || 'USD' },
    ownership_target: Math.max(0, Math.min(100, Number(input.ownership_target) || 0)),
    risk_appetite: input.risk_appetite,
  });
}

export function thesisFit(profile: Lead['profile'], thesis = activeThesis()): ThesisFit {
  const matched: string[] = [];
  const unmatched: string[] = [];
  let score = 0;
  const sectors = lower(profile.sectors);
  const wantedSectors = lower(thesis.sectors);
  if (wantedSectors.length === 0 || wantedSectors.some((sector) => sectors.some((tag) => tag.includes(sector)))) {
    score += 9;
    matched.push(`sector: ${profile.sectors.join(', ') || 'unspecified'}`);
  } else {
    unmatched.push(`sector: ${profile.sectors.join(', ') || 'unspecified'}`);
  }

  if (thesis.stages.length === 0 || lower(thesis.stages).includes(profile.stage.toLowerCase())) {
    score += 4;
    matched.push(`stage: ${profile.stage}`);
  } else {
    unmatched.push(`stage: ${profile.stage}`);
  }

  const geography = profile.geography?.toLowerCase() ?? null;
  if (thesis.geographies.length === 0 || (geography && lower(thesis.geographies).some((place) => geography.includes(place)))) {
    score += 3;
    matched.push(`geography: ${profile.geography ?? 'not disclosed'}`);
  } else {
    unmatched.push(`geography: ${profile.geography ?? 'not disclosed'}`);
  }

  if (
    profile.check_size_target === null ||
    (profile.check_size_target >= thesis.check_size.min && profile.check_size_target <= thesis.check_size.max)
  ) {
    score += 2;
    matched.push('check size: compatible');
  } else {
    unmatched.push('check size: outside thesis range');
  }

  // Risk appetite is transparent rather than inferred from founder attributes.
  score += thesis.risk_appetite === 'high' ? 2 : thesis.risk_appetite === 'medium' ? 1 : 0;
  return { score, matched, unmatched };
}
