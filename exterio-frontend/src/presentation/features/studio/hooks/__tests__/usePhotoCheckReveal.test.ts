import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PHOTO_REVEAL_STAGES,
  REVEAL_STAGE_MS,
  usePhotoCheckReveal,
} from '@/presentation/features/studio/hooks/usePhotoCheckReveal';
import { hasSeenPhotoCheck } from '@/presentation/features/studio/utils/photoCheckSeen';

describe('usePhotoCheckReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks through every stage the first time, then shows the result and remembers it', () => {
    const { result } = renderHook(() => usePhotoCheckReveal('p1', true));
    expect(result.current.isRevealing).toBe(true);
    expect(result.current.activeIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(REVEAL_STAGE_MS * PHOTO_REVEAL_STAGES.length);
    });

    expect(result.current.isRevealing).toBe(false);
    expect(hasSeenPhotoCheck('p1')).toBe(true);
  });

  it('shows the result straight away once it has been seen', () => {
    window.localStorage.setItem('exterio.photoCheckSeen.p1', '1');

    const { result } = renderHook(() => usePhotoCheckReveal('p1', true));

    expect(result.current.isRevealing).toBe(false);
  });

  it('has nothing to reveal without a photo', () => {
    const { result } = renderHook(() => usePhotoCheckReveal('p1', false));

    expect(result.current.isRevealing).toBe(false);
    expect(hasSeenPhotoCheck('p1')).toBe(false);
  });
});
