import { REGION_LABELS, type RegionLabel } from '@/domain/models/project';

export interface RegionLabelMeta {
  label: string;
  plural: string;
  /** Overlay colour on the photo and in the legend. */
  color: string;
}

export const REGION_LABEL_META: Record<RegionLabel, RegionLabelMeta> = {
  wall: { label: 'Wall', plural: 'Walls', color: '#f59e0b' },
  window: { label: 'Window', plural: 'Windows', color: '#0ea5e9' },
  door: { label: 'Door', plural: 'Doors', color: '#8b5cf6' },
  balcony: { label: 'Balcony', plural: 'Balconies', color: '#22c55e' },
  pillar: { label: 'Pillar', plural: 'Pillars', color: '#ef4444' },
  parapet: { label: 'Parapet', plural: 'Parapets', color: '#ec4899' },
  gate: { label: 'Gate', plural: 'Gates', color: '#6366f1' },
  roof_edge: { label: 'Roof edge', plural: 'Roof edges', color: '#84cc16' },
  railing: { label: 'Railing', plural: 'Railings', color: '#0f766e' },
};

export const REGION_LABEL_OPTIONS = REGION_LABELS.map((value) => ({
  value,
  label: REGION_LABEL_META[value].label,
}));

export function isRegionLabel(value: string): value is RegionLabel {
  return (REGION_LABELS as readonly string[]).includes(value);
}

/** Labels whose paintable area depends on how many faces are exposed. */
export function usesSurfaceMultiplier(label: RegionLabel): boolean {
  return label === 'pillar';
}
