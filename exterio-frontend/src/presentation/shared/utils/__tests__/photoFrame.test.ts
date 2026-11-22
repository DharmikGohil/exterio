import { describe, expect, it } from 'vitest';

import { photoFrameStyle } from '@/presentation/shared/utils/photoFrame';

describe('photoFrameStyle', () => {
  it('sizes the frame to the photo at its tallest, never wider than the column', () => {
    expect(photoFrameStyle(1600, 1000).width).toBe(
      'min(100%, calc((max(22rem, 100dvh - 18.5rem)) * 1.6000))'
    );
  });

  it('leaves room for a row of controls above the photo', () => {
    expect(photoFrameStyle(1000, 1000, true).width).toBe(
      'min(100%, calc((max(22rem, 100dvh - 22rem)) * 1.0000))'
    );
  });
});
