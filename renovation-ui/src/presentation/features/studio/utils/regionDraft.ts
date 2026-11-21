import {
  REGION_LABELS,
  type Point,
  type Region,
  type RegionInput,
  type RegionLabel,
} from '@/domain/models/project';

import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';

const DRAFT_ID_PREFIX = 'draft-';
let draftCounter = 0;

/** Regions drawn in this session get a temporary id until the server assigns a real one. */
export function isDraftRegionId(regionId: string): boolean {
  return regionId.startsWith(DRAFT_ID_PREFIX);
}

export function createDraftRegion(label: RegionLabel, name: string, polygon: Point[]): Region {
  draftCounter += 1;
  return {
    id: `${DRAFT_ID_PREFIX}${Date.now()}-${draftCounter}`,
    label,
    name,
    polygon,
    source: 'user',
    surfaceMultiplier: 1,
    areaOverrideSqft: null,
    lengthOverrideFt: null,
  };
}

/** The payload for `PUT /regions`: saved regions keep their id, new ones are sent without. */
export function toRegionInputs(regions: readonly Region[]): RegionInput[] {
  return regions.map(({ id, ...rest }) => (isDraftRegionId(id) ? rest : { id, ...rest }));
}

/** A stable fingerprint used to detect unsaved changes. */
export function serializeRegions(regions: readonly Region[]): string {
  return JSON.stringify(
    regions.map((region) => [
      region.id,
      region.label,
      region.name,
      region.polygon,
      region.surfaceMultiplier,
      region.areaOverrideSqft,
      region.lengthOverrideFt,
    ])
  );
}

/** "Wall 3" for the third wall, skipping names that are already taken. */
export function suggestRegionName(label: RegionLabel, regions: readonly Region[]): string {
  const base = REGION_LABEL_META[label].label;
  const taken = new Set(regions.map((region) => region.name.trim().toLowerCase()));
  let index = regions.filter((region) => region.label === label).length + 1;
  while (taken.has(`${base} ${index}`.toLowerCase())) {
    index += 1;
  }
  return `${base} ${index}`;
}

export interface RegionGroup {
  label: RegionLabel;
  regions: Region[];
}

/** Regions grouped by label, in the canonical label order, without empty groups. */
export function groupRegionsByLabel(regions: readonly Region[]): RegionGroup[] {
  return REGION_LABELS.map((label) => ({
    label,
    regions: regions.filter((region) => region.label === label),
  })).filter((group) => group.regions.length > 0);
}
