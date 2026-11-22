import { describe, expect, it } from 'vitest';

import {
  SHRINK_ABOVE_BYTES,
  fitWithin,
  shrinkForUpload,
} from '@/infrastructure/utils/image/shrinkForUpload';

describe('shrinkForUpload', () => {
  it('fits the long side within the upload size and never enlarges', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 2400, height: 1800 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1800, height: 2400 });
    expect(fitWithin(1200, 800)).toEqual({ width: 1200, height: 800 });
  });

  it('sends a small photo as it is', async () => {
    const file = new File([new Uint8Array(1000)], 'house.jpg', { type: 'image/jpeg' });

    expect(await shrinkForUpload(file)).toBe(file);
  });

  it('sends the original when the photo cannot be read', async () => {
    const file = new File([new Uint8Array(SHRINK_ABOVE_BYTES + 1)], 'house.jpg', {
      type: 'image/jpeg',
    });

    expect(await shrinkForUpload(file)).toBe(file);
  });
});
