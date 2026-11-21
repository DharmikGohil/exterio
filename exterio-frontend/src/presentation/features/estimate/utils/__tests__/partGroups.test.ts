import { describe, expect, it } from 'vitest';

import { buildPartGroups } from '@/presentation/features/estimate/utils/partGroups';
import type { EstimateRegion } from '@/domain/models/estimate';
import type { Region, RegionLabel } from '@/domain/models/project';

const IMAGE = { width: 1000, height: 800 };

function part(
  id: string,
  label: RegionLabel,
  box: [number, number, number, number],
  extra: Partial<EstimateRegion> = {}
): { row: EstimateRegion; region: Region } {
  const [x1, y1, x2, y2] = box;
  return {
    row: {
      regionId: id,
      label,
      name: extra.name ?? id,
      areaSqft: 10,
      lengthFt: 0,
      isOverride: false,
      materialId: null,
      materialName: null,
      materialCost: 0,
      labourCost: 0,
      totalCost: 0,
      ...extra,
    },
    region: {
      id,
      label,
      name: id,
      polygon: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      source: 'user',
      surfaceMultiplier: 1,
      areaOverrideSqft: null,
      lengthOverrideFt: null,
    } as Region,
  };
}

function groups(parts: ReturnType<typeof part>[]) {
  return buildPartGroups(
    parts.map((item) => item.row),
    parts.map((item) => item.region),
    IMAGE
  );
}

describe('buildPartGroups', () => {
  it('makes one card per kind of part, adding up area and cost', () => {
    const actual = groups([
      part('p1', 'pillar', [300, 400, 320, 700], {
        materialName: 'Sandstone cladding',
        areaSqft: 35,
        totalCost: 11000,
      }),
      part('p2', 'pillar', [500, 400, 520, 700], {
        materialName: 'Sandstone cladding',
        areaSqft: 35,
        totalCost: 11927,
      }),
    ]);

    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({
      title: 'Two pillars',
      finishLines: ['Sandstone cladding'],
      measure: '70 sq ft',
      totalCost: 22927,
      isUnpriced: false,
    });
  });

  it('uses the part name for a single part', () => {
    const [actual] = groups([
      part('g', 'gate', [100, 600, 200, 700], { name: 'Gate', lengthFt: 7 }),
    ]);

    expect(actual.title).toBe('Gate');
    expect(actual.measure).toBe('10 sq ft · 7 ft wide');
  });

  it('marks a kind of part with no finish as not in the estimate', () => {
    const [actual] = groups([
      part('w1', 'window', [100, 100, 200, 200], { areaSqft: 60 }),
      part('w2', 'window', [700, 100, 800, 200], { areaSqft: 63 }),
    ]);

    expect(actual.isUnpriced).toBe(true);
    expect(actual.finishLines).toEqual(['No finish chosen yet']);
    expect(actual.measure).toBe('123 sq ft in total');
  });

  it('says when some parts of a priced kind still have no finish', () => {
    const [actual] = groups([
      part('w1', 'wall', [0, 0, 400, 400], { materialName: 'Warm Cream paint', totalCost: 500 }),
      part('w2', 'wall', [600, 0, 1000, 400]),
    ]);

    expect(actual.finishLines).toEqual(['Warm Cream paint', 'One without a finish yet']);
    expect(actual.isUnpriced).toBe(false);
  });

  it('notes that openings are left out of the wall area', () => {
    const actual = groups([
      part('wall', 'wall', [0, 0, 1000, 800], { name: 'Front wall', areaSqft: 377 }),
      part('door', 'door', [450, 500, 550, 800]),
    ]);

    expect(actual.find((group) => group.label === 'wall')?.measure).toBe(
      '377 sq ft, windows and doors left out'
    );
  });

  it('points at the middle of the largest part, as a fraction of the photo', () => {
    const [actual] = groups([
      part('small', 'pillar', [0, 0, 10, 10]),
      part('large', 'pillar', [400, 400, 600, 800]),
    ]);

    expect(actual.anchor).toEqual({ x: 0.5, y: 0.75 });
  });

  it('puts cards on the side their part is on, balanced, top to bottom', () => {
    const actual = groups([
      part('parapet', 'parapet', [100, 50, 400, 90]),
      part('gate', 'gate', [50, 600, 150, 700]),
      part('pillar', 'pillar', [300, 400, 320, 700]),
      part('roof', 'roof_edge', [600, 100, 950, 120]),
      part('window', 'window', [700, 300, 800, 400]),
    ]);

    const left = actual.filter((group) => group.side === 'left').map((group) => group.label);
    const right = actual.filter((group) => group.side === 'right').map((group) => group.label);
    expect(left).toEqual(['parapet', 'pillar', 'gate']);
    expect(right).toEqual(['roof_edge', 'window']);
  });

  it('balances the sides when every part is on one half', () => {
    const actual = groups([
      part('a', 'wall', [0, 0, 100, 100]),
      part('b', 'pillar', [0, 200, 100, 300]),
      part('c', 'gate', [0, 400, 100, 500]),
      part('d', 'door', [0, 600, 100, 700]),
    ]);

    expect(actual.filter((group) => group.side === 'left')).toHaveLength(2);
    expect(actual.filter((group) => group.side === 'right')).toHaveLength(2);
  });

  it('points a card at the part of its group nearest its side', () => {
    const actual = groups([
      part('door-big', 'window', [450, 100, 560, 300]),
      part('left-window', 'window', [100, 150, 190, 230]),
      part('right-window', 'window', [800, 150, 890, 230]),
      part('gate', 'gate', [20, 600, 120, 700]),
      part('pillar', 'pillar', [850, 400, 870, 700]),
    ]);

    const windows = actual.find((group) => group.label === 'window');
    // The biggest window is central; balancing puts the card on the right, so it points at the
    // right-hand window instead of across the photo.
    expect(windows?.side).toBe('right');
    expect(windows?.anchor.x).toBeCloseTo(0.845);
  });

  it('never points at a sliver of a part', () => {
    const [actual] = groups([
      part('big', 'pillar', [480, 100, 560, 700]),
      part('sliver', 'pillar', [10, 100, 12, 110]),
    ]);

    expect(actual.anchor.x).toBeCloseTo(0.52);
  });

  it('gives each named kind of other part its own card', () => {
    const actual = groups([
      part('s1', 'other', [100, 50, 200, 100], { name: 'Solar panels', areaSqft: 40 }),
      part('s2', 'other', [300, 50, 400, 100], { name: 'Solar panels', areaSqft: 40 }),
      part('t1', 'other', [800, 50, 900, 150], { name: 'Water tank' }),
    ]);

    expect(actual.map((group) => [group.key, group.title]).sort()).toEqual([
      ['other:solar panels', 'Solar panels (2)'],
      ['other:water tank', 'Water tank'],
    ]);
  });

  it('measures a fence along its length', () => {
    const [actual] = groups([
      part('f', 'fence', [0, 600, 1000, 700], { name: 'Fence 1', areaSqft: 180, lengthFt: 60 }),
    ]);

    expect(actual.measure).toBe('180 sq ft · 60 ft long');
  });
});
