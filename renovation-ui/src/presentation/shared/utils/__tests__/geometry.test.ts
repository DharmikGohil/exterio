import { describe, expect, it } from 'vitest';

import {
  closestPointOnSegment,
  getBounds,
  getPolygonArea,
  sortByAreaDescending,
} from '@/presentation/shared/utils/geometry';
import type { Point } from '@/domain/models/project';

const square: Point[] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

describe('geometry', () => {
  it('measures a polygon area regardless of winding', () => {
    expect(getPolygonArea(square)).toBe(100);
    expect(getPolygonArea([...square].reverse())).toBe(100);
  });

  it('finds the bounding box, or null for no points', () => {
    expect(getBounds(square)).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    expect(getBounds([])).toBeNull();
  });

  it('projects a point onto a segment and clamps to its ends', () => {
    expect(closestPointOnSegment([5, 7], [0, 0], [10, 0])).toEqual([5, 0]);
    expect(closestPointOnSegment([-4, 3], [0, 0], [10, 0])).toEqual([0, 0]);
  });

  it('sorts regions largest first so small ones are drawn on top', () => {
    const small = { id: 'small', polygon: square.map(([x, y]) => [x / 2, y / 2] as Point) };
    const large = { id: 'large', polygon: square };

    expect(sortByAreaDescending([small, large]).map((item) => item.id)).toEqual(['large', 'small']);
  });
});
