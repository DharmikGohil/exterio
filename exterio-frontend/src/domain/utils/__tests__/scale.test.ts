import { describe, expect, it } from 'vitest';

import { describeScaleProblem } from '@/domain/utils/scale';
import type { ScaleReference } from '@/domain/models/project';

const baseScale: ScaleReference = {
  method: 'facade_dimensions',
  facadeCorners: [
    [0, 0],
    [100, 0],
    [100, 80],
    [0, 80],
  ],
  referenceLine: null,
  referenceLengthFt: null,
  facadeWidthFt: null,
  facadeHeightFt: null,
  storeys: 1,
  doorHeightFt: 7,
};

describe('describeScaleProblem', () => {
  it('needs both wall dimensions for the wall-size method', () => {
    expect(describeScaleProblem({ ...baseScale, facadeWidthFt: 30 })).toMatch(
      /width and the height/
    );
    expect(
      describeScaleProblem({ ...baseScale, facadeWidthFt: 30, facadeHeightFt: 20 })
    ).toBeNull();
  });

  it('rejects zero, negative and non-finite sizes', () => {
    expect(
      describeScaleProblem({ ...baseScale, facadeWidthFt: 0, facadeHeightFt: 20 })
    ).not.toBeNull();
    expect(
      describeScaleProblem({ ...baseScale, facadeWidthFt: -5, facadeHeightFt: 20 })
    ).not.toBeNull();
    expect(
      describeScaleProblem({ ...baseScale, facadeWidthFt: Number.NaN, facadeHeightFt: 20 })
    ).not.toBeNull();
  });

  it('asks for the line before its length for the one-measurement method', () => {
    const inputScale: ScaleReference = {
      ...baseScale,
      method: 'reference_line',
      referenceLengthFt: 10,
    };

    expect(describeScaleProblem(inputScale)).toMatch(/two ends/);
    expect(
      describeScaleProblem({
        ...inputScale,
        referenceLine: [
          [10, 10],
          [50, 10],
        ],
      })
    ).toBeNull();
  });

  it('needs a whole number of floors, at least one', () => {
    const inputScale: ScaleReference = { ...baseScale, method: 'storey_height' };

    expect(describeScaleProblem({ ...inputScale, storeys: 0 })).not.toBeNull();
    expect(describeScaleProblem({ ...inputScale, storeys: 1.5 })).not.toBeNull();
    expect(describeScaleProblem({ ...inputScale, storeys: 2 })).toBeNull();
  });
});
