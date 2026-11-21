import { describe, expect, it } from 'vitest';

import {
  describeExclusions,
  describeLeftOut,
  describeScaleBasis,
  describeUses,
  describeWaste,
  goodToKnow,
} from '@/presentation/features/estimate/utils/estimateCopy';
import type { PartGroup } from '@/presentation/features/estimate/utils/partGroups';
import type { EstimateRegion } from '@/domain/models/estimate';
import type { RegionLabel, ScaleReference } from '@/domain/models/project';

function scale(patch: Partial<ScaleReference>): ScaleReference {
  return {
    method: 'facade_dimensions',
    facadeWidthFt: 30,
    facadeHeightFt: 20,
    referenceLengthFt: null,
    doorHeightFt: 7,
    storeys: 2,
    ...patch,
  } as ScaleReference;
}

function group(title: string, isUnpriced: boolean): PartGroup {
  return {
    key: title,
    label: 'window',
    title,
    color: '#000',
    finishLines: [],
    measure: '',
    totalCost: 0,
    isUnpriced,
    anchor: { x: 0, y: 0 },
    side: 'left',
  };
}

describe('describeScaleBasis', () => {
  it.each([
    [scale({}), 'a wall of 30 × 20 ft'],
    [scale({ method: 'reference_line', referenceLengthFt: 12 }), 'one length of 12 ft'],
    [scale({ method: 'door_height' }), 'a door 7 ft tall'],
    [scale({ method: 'storey_height', storeys: 1 }), 'one floor'],
    [scale({ method: 'storey_height', storeys: 2 }), '2 floors'],
    [null, 'a rough guess'],
  ])('describes %#', (input, expected) => {
    expect(describeScaleBasis(input)).toBe(expected);
  });
});

describe('describeExclusions', () => {
  it('names the parts left out, then what no estimate includes', () => {
    const actual = describeExclusions([
      group('Front wall', false),
      group('Five windows', true),
      group('Main door', true),
    ]);

    expect(actual).toBe(
      'Five windows and main door have no finish yet, so they are not counted. GST, scaffolding, wall repair and transport are not included. This is a guide, not a quotation.'
    );
  });

  it('agrees with a single part', () => {
    expect(describeExclusions([group('Main door', true)])).toMatch(
      /^Main door has no finish yet, so it is not counted\./
    );
  });

  it('only lists what is not included when every part is priced', () => {
    expect(describeExclusions([group('Front wall', false)])).toMatch(/^GST, scaffolding/);
  });
});

function row(label: EstimateRegion['label'], name: string, materialId: string | null) {
  return {
    regionId: name,
    label,
    name,
    areaSqft: 10,
    lengthFt: 0,
    isOverride: false,
    materialId,
    materialName: materialId,
    materialCost: 0,
    labourCost: 0,
    totalCost: 0,
  } satisfies EstimateRegion;
}

describe('describeUses', () => {
  const plural = (label: RegionLabel) => ({ pillar: 'Pillars', wall: 'Walls' })[label as 'wall'];

  it('lists single parts by name and several by count, in the given order', () => {
    const rows = [
      row('pillar', 'Pillar 1', 'paint'),
      row('wall', 'Front wall', 'paint'),
      row('pillar', 'Pillar 2', 'paint'),
      row('wall', 'Side wall', 'stone'),
    ];

    expect(describeUses('paint', rows, ['wall', 'pillar'], plural)).toBe(
      'Front wall and two pillars'
    );
  });
});

describe('describeWaste', () => {
  it('states the exact need and the allowance on top', () => {
    expect(describeWaste({ netQuantity: 91.4, wastagePct: 5, unit: 'sqft' })).toBe(
      '91 sq ft plus 5% extra for waste'
    );
  });

  it('leaves the allowance out when there is none', () => {
    expect(describeWaste({ netQuantity: 12, wastagePct: 0, unit: 'rft' })).toBe('12 running ft');
  });
});

describe('describeLeftOut', () => {
  it('is null when every part has a finish', () => {
    expect(describeLeftOut([group('Front wall', false)])).toBeNull();
  });
});

describe('goodToKnow', () => {
  it('adds the roof note only when a roof is measured', () => {
    expect(goodToKnow(scale({}), 8, false).join(' ')).not.toContain('roof');
    expect(goodToKnow(scale({}), 8, true).join(' ')).toContain('sloped roof');
  });

  it('says the sizes are a rough guess without a scale', () => {
    expect(goodToKnow(null, 30, false)[0]).toContain('rough guess');
  });
});
