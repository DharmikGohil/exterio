import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  REVEAL_DONE_MS,
  REVEAL_STEP_MS,
  useRegionReveal,
} from '@/presentation/features/studio/hooks/useRegionReveal';

describe('useRegionReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the found parts one after another, says done, then steps aside', () => {
    const { result } = renderHook(() => useRegionReveal());

    act(() => result.current.start(['roof', 'wall', 'window']));
    expect(result.current.shown).toBe(1);
    expect([...result.current.hiddenIds]).toEqual(['wall', 'window']);
    expect(result.current.freshIds.has('roof')).toBe(true);

    act(() => {
      vi.advanceTimersByTime(REVEAL_STEP_MS * 2);
    });
    expect(result.current.shown).toBe(3);
    expect(result.current.isDone).toBe(true);
    expect(result.current.hiddenIds.size).toBe(0);

    act(() => {
      vi.advanceTimersByTime(REVEAL_DONE_MS + REVEAL_STEP_MS * 3);
    });
    expect(result.current.isActive).toBe(false);
  });

  it('does nothing when nothing was found', () => {
    const { result } = renderHook(() => useRegionReveal());

    act(() => result.current.start([]));

    expect(result.current.isActive).toBe(false);
  });
});
