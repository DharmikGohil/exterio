import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Point, Region, RegionLabel } from '@/domain/models/project';
import { useSyncedDraft } from '@/presentation/shared/hooks/useSyncedDraft';
import {
  createDraftRegion,
  serializeRegions,
} from '@/presentation/features/studio/utils/regionDraft';

export const MIN_POLYGON_POINTS = 3;
/** How many steps back Undo can go. */
export const MAX_UNDO_STEPS = 100;
/**
 * Changes to the same thing this close together are one step: a corner dragged across the photo
 * or a name typed letter by letter is undone in one go.
 */
export const MERGE_WINDOW_MS = 1000;

interface History {
  past: Region[][];
  future: Region[][];
}

export type RegionPatch = Partial<Pick<Region, 'name' | 'label' | 'surfaceMultiplier'>>;

/**
 * The locally edited copy of a project's regions, with undo and redo.
 * Nothing here talks to the server; `isDirty` says whether there is something to save.
 * Every change records the regions as they were, so Undo can step back through edits, a
 * discard, or regions replaced by Auto-detect.
 */
export function useRegionDraft(savedRegions: Region[]) {
  const savedSignature = useMemo(() => serializeRegions(savedRegions), [savedRegions]);
  const { draft: regions, updateDraft, resetDraft } = useSyncedDraft(savedRegions, savedSignature);
  const isDirty = useMemo(
    () => serializeRegions(regions) !== savedSignature,
    [regions, savedSignature]
  );

  const [history, setHistory] = useState<History>({ past: [], future: [] });
  const regionsRef = useRef(regions);
  const lastChangeRef = useRef<{ group: string; at: number } | null>(null);
  useEffect(() => {
    regionsRef.current = regions;
  }, [regions]);

  /** Remembers the regions before a change; `group` merges a run of the same change. */
  const record = useCallback((group?: string) => {
    const now = Date.now();
    const last = lastChangeRef.current;
    lastChangeRef.current = group ? { group, at: now } : null;
    if (group && last && last.group === group && now - last.at < MERGE_WINDOW_MS) {
      return;
    }
    const before = regionsRef.current;
    setHistory((current) => ({
      past: [...current.past, before].slice(-MAX_UNDO_STEPS),
      future: [],
    }));
  }, []);

  const change = useCallback(
    (updater: (current: Region[]) => Region[], group?: string) => {
      record(group);
      updateDraft(updater);
    },
    [record, updateDraft]
  );

  const undo = useCallback(() => {
    const previous = history.past[history.past.length - 1];
    if (!previous) {
      return;
    }
    lastChangeRef.current = null;
    setHistory({
      past: history.past.slice(0, -1),
      future: [regionsRef.current, ...history.future],
    });
    updateDraft(() => previous);
  }, [history, updateDraft]);

  const redo = useCallback(() => {
    const [next, ...rest] = history.future;
    if (!next) {
      return;
    }
    lastChangeRef.current = null;
    setHistory({ past: [...history.past, regionsRef.current], future: rest });
    updateDraft(() => next);
  }, [history, updateDraft]);

  const updatePolygon = useCallback(
    (regionId: string, updater: (polygon: Point[]) => Point[], group?: string) => {
      change(
        (current) =>
          current.map((region) =>
            region.id === regionId ? { ...region, polygon: updater(region.polygon) } : region
          ),
        group
      );
    },
    [change]
  );

  const moveVertex = useCallback(
    (regionId: string, index: number, point: Point) => {
      updatePolygon(
        regionId,
        (polygon) => polygon.map((existing, position) => (position === index ? point : existing)),
        `move:${regionId}:${index}`
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
      change(
        (current) =>
          current.map((region) => (region.id === regionId ? { ...region, ...patch } : region)),
        `edit:${regionId}:${Object.keys(patch).sort().join(',')}`
      );
    },
    [change]
  );

  const deleteRegion = useCallback(
    (regionId: string) => {
      change((current) => current.filter((region) => region.id !== regionId));
    },
    [change]
  );

  const addRegion = useCallback(
    (label: RegionLabel, name: string, polygon: Point[]): string => {
      const region = createDraftRegion(label, name, polygon);
      change((current) => [...current, region]);
      return region.id;
    },
    [change]
  );

  const discardChanges = useCallback(() => {
    record();
    resetDraft();
  }, [record, resetDraft]);

  return {
    regions,
    isDirty,
    moveVertex,
    insertVertex,
    removeVertex,
    updateRegion,
    deleteRegion,
    addRegion,
    discardChanges,
    undo,
    redo,
    /** Records the current regions as an undo step, e.g. before Auto-detect replaces them. */
    checkpoint: record,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
