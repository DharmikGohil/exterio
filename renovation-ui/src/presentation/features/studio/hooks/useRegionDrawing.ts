import { useCallback, useState } from 'react';

import type { Point } from '@/domain/models/project';

import { MIN_POLYGON_POINTS } from './useRegionDraft';

/**
 * "Draw region" mode: clicks add points; closing the shape hands it over as
 * `pendingPolygon` so the user can pick what it is.
 */
export function useRegionDrawing() {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [pendingPolygon, setPendingPolygon] = useState<Point[] | null>(null);

  const isDrawing = points !== null;
  const canFinish = (points?.length ?? 0) >= MIN_POLYGON_POINTS;

  const startDrawing = useCallback(() => setPoints([]), []);
  const cancelDrawing = useCallback(() => setPoints(null), []);

  const addPoint = useCallback((point: Point) => {
    setPoints((current) => (current ? [...current, point] : current));
  }, []);

  const undoPoint = useCallback(() => {
    setPoints((current) => (current ? current.slice(0, -1) : current));
  }, []);

  const finishDrawing = useCallback(() => {
    if (points && points.length >= MIN_POLYGON_POINTS) {
      setPendingPolygon(points);
      setPoints(null);
    }
  }, [points]);

  const clearPending = useCallback(() => setPendingPolygon(null), []);

  return {
    isDrawing,
    drawPoints: points ?? [],
    canFinish,
    pendingPolygon,
    startDrawing,
    cancelDrawing,
    addPoint,
    undoPoint,
    finishDrawing,
    clearPending,
  };
}
