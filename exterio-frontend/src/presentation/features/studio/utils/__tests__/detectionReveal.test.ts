import { describe, expect, it } from 'vitest';

import type { Region } from '@/domain/models/project';
import { orderForReveal } from '@/presentation/features/studio/utils/detectionReveal';

const region = (id: string, label: string, top: number, source = 'auto') =>
  ({
    id,
    label,
    source,
    polygon: [
      [0, top],
      [10, top],
      [10, top + 10],
    ],
  }) as unknown as Region;

describe('orderForReveal', () => {
  it('draws roofs and walls first, then openings, each kind top to bottom', () => {
    const regions = [
      region('door', 'door', 300),
      region('lower-wall', 'wall', 200),
      region('upper-window', 'window', 50),
      region('upper-wall', 'wall', 20),
      region('roof', 'roof', 0),
      region('mine', 'fence', 0, 'user'),
    ];

    expect(orderForReveal(regions)).toEqual([
      'roof',
      'upper-wall',
      'lower-wall',
      'upper-window',
      'door',
    ]);
  });
});
