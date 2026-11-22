import { describe, expect, it } from 'vitest';

import { maxPhotoHeight, photoFrameStyle } from '@/presentation/shared/utils/photoFrame';

describe('photoFrameStyle', () => {
  it('sizes the frame to the photo at its tallest, never wider than the column', () => {
    expect(photoFrameStyle(1600, 1000).width).toBe(
      'min(100%, calc((max(18rem, 100dvh - 18.5rem)) * 1.6000))'
    );
  });

  it('makes the photo shorter by the real height of the row of controls above it', () => {
    expect(maxPhotoHeight(44)).toBe('max(18rem, 100dvh - 18.5rem - 56px)');
    expect(maxPhotoHeight(100)).toBe('max(18rem, 100dvh - 18.5rem - 112px)');
    expect(photoFrameStyle(1000, 1000, 100).width).toBe(
      'min(100%, calc((max(18rem, 100dvh - 18.5rem - 112px)) * 1.0000))'
    );
  });
});
