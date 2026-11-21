import type { Design } from '@/domain/models/design';

/** `[x, y]` in pixels of the stored project image, origin top-left. */
export type Point = [number, number];

/** Kinds of part, in the order lists show them. `other` is any part the detector named itself. */
export const REGION_LABELS = [
  'wall',
  'roof',
  'window',
  'door',
  'garage_door',
  'balcony',
  'pillar',
  'parapet',
  'chimney',
  'gate',
  'fence',
  'roof_edge',
  'railing',
  'other',
] as const;

export type RegionLabel = (typeof REGION_LABELS)[number];

export type QualitySeverity = 'error' | 'warning';

export interface QualityIssue {
  code: string;
  severity: QualitySeverity;
  message: string;
}

export interface QualityMetrics {
  width: number;
  height: number;
  blurScore: number;
  brightness: number;
}

export interface QualityReport {
  /** `false` means the upload was rejected. */
  usable: boolean;
  /** 0-100 */
  score: number;
  issues: QualityIssue[];
  /** Plain-language tips for the user. */
  guidance: string[];
  metrics: QualityMetrics;
}

export interface ProjectImage {
  url: string;
  width: number;
  height: number;
  quality: QualityReport;
}

export type RegionSource = 'auto' | 'user';

export interface Region {
  id: string;
  label: RegionLabel;
  name: string;
  /** At least 3 points. */
  polygon: Point[];
  source: RegionSource;
  /** Default 1; e.g. 3 for a pillar with 3 exposed faces. */
  surfaceMultiplier: number;
  /** User-typed area, wins over the computed one. */
  areaOverrideSqft: number | null;
  /** User-typed length (railings). */
  lengthOverrideFt: number | null;
}

export type RegionInput = Omit<Region, 'id' | 'source'> & { id?: string; source?: RegionSource };

export const SCALE_METHODS = [
  'facade_dimensions',
  'reference_line',
  'door_height',
  'storey_height',
] as const;

export type ScaleMethod = (typeof SCALE_METHODS)[number];

export type FacadeCorners = [Point, Point, Point, Point];

export interface ScaleReference {
  method: ScaleMethod;
  /** TL, TR, BR, BL of the main facade plane. */
  facadeCorners: FacadeCorners;
  referenceLine: [Point, Point] | null;
  referenceLengthFt: number | null;
  facadeWidthFt: number | null;
  facadeHeightFt: number | null;
  /** Used by `storey_height` (10 ft per storey). */
  storeys: number;
  /** Used by `door_height` (default 7). */
  doorHeightFt: number;
}

export interface RateOverride {
  materialRate?: number;
  labourRate?: number;
  wastagePct?: number;
}

/** materialId -> override */
export type RateOverrides = Record<string, RateOverride>;

export interface Project {
  id: string;
  name: string;
  image: ProjectImage | null;
  regions: Region[];
  /** `null` means the server falls back to a storey-height default. */
  scale: ScaleReference | null;
  designs: Design[];
  rateOverrides: RateOverrides;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  designCount: number;
  /** The studio step to carry on at, 1 (Photo) to 5 (Estimate). */
  progressStep: number;
  /** Where the house is, in words: "Designing", "Estimate ready". */
  progressLabel: string;
  /** The latest priced design's total; null until a design has a finish. */
  estimateTotal: number | null;
  /** The last change to the house or any of its designs. */
  updatedAt: string;
}
