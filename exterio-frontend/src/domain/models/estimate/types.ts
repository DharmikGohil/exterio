import type { MaterialCategory, MaterialUnit } from '@/domain/models/material';
import type { RegionLabel, ScaleMethod } from '@/domain/models/project';

export interface EstimateScale {
  method: ScaleMethod;
  feetPerPixelX: number;
  feetPerPixelY: number;
  /** +/- band applied to totals, e.g. 15 */
  confidencePct: number;
  note: string;
}

export interface EstimateRegion {
  regionId: string;
  label: RegionLabel;
  name: string;
  areaSqft: number;
  lengthFt: number;
  isOverride: boolean;
  materialId: string | null;
  materialName: string | null;
  /** This part's share of its material line; zero when it has no finish. */
  materialCost: number;
  labourCost: number;
  totalCost: number;
}

export interface EstimateSurface {
  label: RegionLabel;
  count: number;
  areaSqft: number;
  lengthFt: number;
}

export interface EstimateLine {
  materialId: string;
  materialName: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  netQuantity: number;
  wastagePct: number;
  grossQuantity: number;
  purchaseQuantity: number;
  purchaseUnit: string;
  purchaseNote: string;
  materialRate: number;
  labourRate: number;
  materialCost: number;
  labourCost: number;
  total: number;
}

export interface EstimateCategory {
  category: MaterialCategory;
  materialCost: number;
  labourCost: number;
  total: number;
}

export interface EstimateTotals {
  materialCost: number;
  labourCost: number;
  grandTotal: number;
  lowEstimate: number;
  highEstimate: number;
}

export interface Estimate {
  designId: string;
  currency: 'INR';
  scale: EstimateScale;
  regions: EstimateRegion[];
  surfaces: EstimateSurface[];
  lines: EstimateLine[];
  categories: EstimateCategory[];
  totals: EstimateTotals;
  assumptions: string[];
}
