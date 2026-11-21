import { useCallback, useMemo } from 'react';

import type { Point, Region, RegionLabel } from '@/domain/models/project';
import { useSyncedDraft } from '@/presentation/shared/hooks/useSyncedDraft';
import {
  createDraftRegion,
  serializeRegions,
} from '@/presentation/features/studio/utils/regionDraft';

export const MIN_POLYGON_POINTS = 3;

export type RegionPatch = Partial<Pick<Region, 'name' | 'label' | 'surfaceMultiplier'>>;

/**
 * The locally edited copy of a project's regions.
 * Nothing here talks to the server; `isDirty` says whether there is something to save.
 */
export function useRegionDraft(savedRegions: Region[]) {
  const savedSignature = useMemo(() => serializeRegions(savedRegions), [savedRegions]);
  const { draft: regions, updateDraft, resetDraft } = useSyncedDraft(savedRegions, savedSignature);
  const isDirty = useMemo(
    () => serializeRegions(regions) !== savedSignature,
    [regions, savedSignature]
  );

  const updatePolygon = useCallback(
    (regionId: string, updater: (polygon: Point[]) => Point[]) => {
      updateDraft((current) =>
        current.map((region) =>
          region.id === regionId ? { ...region, polygon: updater(region.polygon) } : region
        )
      );
    },
    [updateDraft]
  );

  const moveVertex = useCallback(
    (regionId: string, index: number, point: Point) => {
      updatePolygon(regionId, (polygon) =>
        polygon.map((existing, position) => (position === index ? point : existing))
      );
    },
    [updatePolygon]
  );

  const insertVertex = useCallback(
    (regionId: string, afterIndex: number, point: Point) => {
      updatePolygon(regionId, (polygon) => [
        ...polygon.slice(0, afterIndex + 1),
        point,
        ...polygon.slice(afterIndex + 1),
      ]);
    },
    [updatePolygon]
  );

  /** Removes a vertex unless that would leave fewer than three. */
  const removeVertex = useCallback(
    (regionId: string, index: number) => {
      updatePolygon(regionId, (polygon) =>
        polygon.length > MIN_POLYGON_POINTS
          ? polygon.filter((_point, position) => position !== index)
          : polygon
      );
    },
    [updatePolygon]
  );

  const updateRegion = useCallback(
    (regionId: string, patch: RegionPatch) => {
      updateDraft((current) =>
        current.map((region) => (region.id === regionId ? { ...region, ...patch } : region))
      );
    },
    [updateDraft]
  );

  const deleteRegion = useCallback(
    (regionId: string) => {
      updateDraft((current) => current.filter((region) => region.id !== regionId));
    },
    [updateDraft]
  );

  const addRegion = useCallback(
    (label: RegionLabel, name: string, polygon: Point[]): string => {
      const region = createDraftRegion(label, name, polygon);
      updateDraft((current) => [...current, region]);
      return region.id;
    },
    [updateDraft]
  );

  return {
    regions,
    isDirty,
    moveVertex,
    insertVertex,
    removeVertex,
    updateRegion,
    deleteRegion,
    addRegion,
    discardChanges: resetDraft,
  };
}
