import type { Region, RegionLabel } from '@/domain/models/project';

/**
 * The order detected parts are drawn in when they arrive: the big surfaces first, then the
 * openings, then the smaller parts, the way a person would point them out.
 */
const REVEAL_ORDER: readonly RegionLabel[] = [
  'roof',
  'chimney',
  'wall',
  'roof_edge',
  'parapet',
  'balcony',
  'window',
  'door',
  'garage_door',
  'pillar',
  'railing',
  'gate',
  'fence',
  'other',
];

/** Ids of the AI's regions in reveal order; within a kind, top to bottom, then left to right. */
export function orderForReveal(regions: readonly Region[]): string[] {
  const rank = (region: Region) => REVEAL_ORDER.indexOf(region.label);
  const top = (region: Region) => Math.min(...region.polygon.map((point) => point[1]));
  const left = (region: Region) => Math.min(...region.polygon.map((point) => point[0]));
  return regions
    .filter((region) => region.source === 'auto')
    .sort((a, b) => rank(a) - rank(b) || top(a) - top(b) || left(a) - left(b))
    .map((region) => region.id);
}

/** What the pill says while parts of this kind are being drawn. */
export function revealPhrase(label: RegionLabel): string {
  switch (label) {
    case 'roof':
    case 'chimney':
    case 'wall':
    case 'roof_edge':
    case 'parapet':
    case 'balcony':
      return 'Outlining the walls and roof';
    case 'window':
    case 'door':
    case 'garage_door':
      return 'Finding windows, doors and the garage';
    case 'pillar':
    case 'railing':
    case 'gate':
      return 'Adding pillars, railings and gates';
    default:
      return 'Adding fences and extras';
  }
}
