import type { Point } from '@/domain/models/project';

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rounds to one decimal so payloads stay small and stable. */
export function roundPoint([x, y]: Point): Point {
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

/** The `points` attribute for an SVG polygon / polyline. */
export function toSvgPoints(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

export function getBounds(points: readonly Point[]): Bounds | null {
  if (points.length === 0) {
    return null;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

/** The point on segment a-b closest to `point`. */
export function closestPointOnSegment(point: Point, a: Point, b: Point): Point {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return a;
  }
  const t = clamp(((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared, 0, 1);
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Polygon area in square pixels (shoelace formula). */
export function getPolygonArea(points: readonly Point[]): number {
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[(index + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/**
 * Largest shapes first, so that when shapes overlap (a window inside a wall) the smaller
 * one is drawn last and stays clickable.
 */
export function sortByAreaDescending<T extends { polygon: readonly Point[] }>(
  items: readonly T[]
): T[] {
  return [...items].sort((a, b) => getPolygonArea(b.polygon) - getPolygonArea(a.polygon));
}
