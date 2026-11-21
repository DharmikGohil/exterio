import type { RegionLabel } from '@/domain/models/project';

export const MATERIAL_CATEGORIES = [
  'paint',
  'texture',
  'stone',
  'tile',
  'panel',
  'glass_railing',
  'metal_railing',
] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/** `sqft` = square feet, `rft` = running feet. */
export type MaterialUnit = 'sqft' | 'rft';

export interface Material {
  id: string;
  category: MaterialCategory;
  name: string;
  description: string;
  unit: MaterialUnit;
  colorHex: string;
  swatchUrl: string;
  /** INR per unit */
  materialRate: number;
  /** INR per unit */
  labourRate: number;
  wastagePct: number;
  appliesTo: RegionLabel[];
  durability: string;
  maintenance: string;
}
