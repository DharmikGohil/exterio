import type { RegionLabel } from '@/domain/models/project';

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
