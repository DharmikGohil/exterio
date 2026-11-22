import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DETECTION_STAGES,
  SLOW_DETECTION_SECONDS,
  detectionProgressAt,
  detectionStageAt,
  useDetectionProgress,
} from '@/presentation/features/studio/hooks/useDetectionProgress';

describe('detection progress', () => {
  it('walks through the stages and never fills the bar on its own', () => {
    expect(detectionStageAt(0)).toBe(0);
    expect(detectionStageAt(9)).toBe(2);
    expect(detectionStageAt(600)).toBe(DETECTION_STAGES.length - 1);
    expect(detectionProgressAt(0)).toBe(0);
    expect(detectionProgressAt(17)).toBeGreaterThan(0.5);
    expect(detectionProgressAt(600)).toBeLessThan(1);
  });

  describe('useDetectionProgress', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('counts from when detection starts, calls out a slow one and resets after', () => {
      const { result, rerender } = renderHook(({ active }) => useDetectionProgress(active), {
        initialProps: { active: true },
      });
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(result.current.seconds).toBe(10);
      expect(result.current.stageIndex).toBe(2);
      expect(result.current.isSlow).toBe(false);

      act(() => {
        vi.advanceTimersByTime(SLOW_DETECTION_SECONDS * 1000);
      });
      expect(result.current.isSlow).toBe(true);

      rerender({ active: false });
      expect(result.current.seconds).toBe(0);
    });
  });
});
