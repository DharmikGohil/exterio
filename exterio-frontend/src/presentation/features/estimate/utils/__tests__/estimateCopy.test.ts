import { describe, expect, it } from 'vitest';

import {
  describeExclusions,
  describeScaleBasis,
} from '@/presentation/features/estimate/utils/estimateCopy';
import type { PartGroup } from '@/presentation/features/estimate/utils/partGroups';
import type { ScaleReference } from '@/domain/models/project';

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
