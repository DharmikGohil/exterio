import {
  MATERIAL_CATEGORIES,
  type Material,
  type MaterialCategory,
} from '@/domain/models/material';
import type { RegionLabel } from '@/domain/models/project';

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  paint: 'Paint',
  texture: 'Texture finish',
  stone: 'Stone cladding',
  tile: 'Tiles',
  panel: 'Panels',
  glass_railing: 'Glass railing',
  metal_railing: 'Metal railing',
};

export interface MaterialGroup {
  category: MaterialCategory;
  materials: Material[];
}

/** Materials that may be applied to a region type, grouped by category in catalog order. */
export function groupMaterialsForLabel(
  materials: readonly Material[],
  label: RegionLabel
): MaterialGroup[] {
  const applicable = materials.filter((material) => material.appliesTo.includes(label));
  return MATERIAL_CATEGORIES.map((category) => ({
    category,
    materials: applicable.filter((material) => material.category === category),
  })).filter((group) => group.materials.length > 0);
}

export function indexMaterialsById(materials: readonly Material[]): Map<string, Material> {
  return new Map(materials.map((material) => [material.id, material]));
}
