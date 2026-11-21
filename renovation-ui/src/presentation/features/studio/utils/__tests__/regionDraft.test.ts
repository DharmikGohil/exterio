import { describe, expect, it } from 'vitest';

import {
  createDraftRegion,
  groupRegionsByLabel,
  suggestRegionName,
  toRegionInputs,
} from '@/presentation/features/studio/utils/regionDraft';
import type { Point, Region } from '@/domain/models/project';

const triangle: Point[] = [
  [0, 0],
  [10, 0],
  [0, 10],
];

const savedWall: Region = {
  id: 'server-id-1',
  label: 'wall',
  name: 'Wall 1',
  polygon: triangle,
  source: 'auto',
  surfaceMultiplier: 1,
  areaOverrideSqft: null,
  lengthOverrideFt: null,
};

describe('region drafts', () => {
  it('sends new regions without an id and keeps the id of saved ones', () => {
    const draft = createDraftRegion('pillar', 'Pillar 1', triangle);

    const [saved, created] = toRegionInputs([savedWall, draft]);

    expect(saved).toHaveProperty('id', 'server-id-1');
    expect(created).not.toHaveProperty('id');
    expect(created).toMatchObject({ label: 'pillar', name: 'Pillar 1', source: 'user' });
  });

  it('suggests the next free name for a label', () => {
    expect(suggestRegionName('wall', [savedWall])).toBe('Wall 2');
    expect(suggestRegionName('window', [savedWall])).toBe('Window 1');
  });

  it('groups regions by label in a fixed order and drops empty groups', () => {
    const pillar = createDraftRegion('pillar', 'Pillar 1', triangle);

    const actual = groupRegionsByLabel([pillar, savedWall]);

    expect(actual.map((group) => group.label)).toEqual(['wall', 'pillar']);
  });
});
