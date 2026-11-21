import { describe, expect, it } from 'vitest';

import { NAME_TAG_HEIGHT_PX, layoutNameTags } from '@/presentation/shared/utils/nameTagLayout';
import type { Point } from '@/domain/models/project';

const box = (x: number, y: number, size = 100): Point[] => [
  [x, y],
  [x + size, y],
  [x + size, y + size],
  [x, y + size],
];

describe('layoutNameTags', () => {
  it('pins each tag inside the top-left corner of its region', () => {
    const [actual] = layoutNameTags([{ id: 'a', name: 'Wall 1', polygon: box(50, 80) }], 1);

    expect(actual.x).toBeGreaterThan(50);
    expect(actual.y).toBeGreaterThan(80);
    expect(actual.height).toBe(NAME_TAG_HEIGHT_PX);
  });

  it('moves a tag down when it would cover one already placed', () => {
    const [first, second] = layoutNameTags(
      [
        { id: 'wall', name: 'Wall 1', polygon: box(0, 0, 300) },
        { id: 'parapet', name: 'Parapet 1', polygon: box(0, 0, 40) },
      ],
      1
    );

    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  });

  it('scales tags with the canvas so they keep one on-screen size', () => {
    const [normal] = layoutNameTags([{ id: 'a', name: 'Door 1', polygon: box(0, 0) }], 1);
    const [zoomedOut] = layoutNameTags([{ id: 'a', name: 'Door 1', polygon: box(0, 0) }], 2);

    expect(zoomedOut.width).toBeCloseTo(normal.width * 2);
    expect(zoomedOut.height).toBeCloseTo(normal.height * 2);
  });

  it('skips regions without points', () => {
    expect(layoutNameTags([{ id: 'empty', name: 'Ghost', polygon: [] }], 1)).toEqual([]);
  });
});
