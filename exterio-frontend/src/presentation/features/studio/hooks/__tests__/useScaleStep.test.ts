import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useScaleStep,
  SCALE_AUTOSAVE_DELAY_MS,
} from '@/presentation/features/studio/hooks/useScaleStep';
import { buildDefaultScale } from '@/presentation/features/studio/utils/scaleDefaults';
import type { Project, ProjectImage, ScaleReference } from '@/domain/models/project';

const saveScale = vi.fn();

vi.mock('@/presentation/features/projects/hooks/useScaleActions', () => ({
  useScaleActions: () => ({ saveScale, isSavingScale: false }),
}));
vi.mock('@/presentation/shared/hooks/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: (isDirty: boolean) => ({
    isBlocked: false,
    isDirty,
    stay: vi.fn(),
    leave: vi.fn(),
  }),
}));

const image = { url: '/house.jpg', width: 1500, height: 1000 } as ProjectImage;

function savedProject(): Project {
  const scale: ScaleReference = {
    ...buildDefaultScale(image, []),
    facadeWidthFt: 30,
    facadeHeightFt: 20,
  };
  return { id: 'p1', scale, regions: [] } as unknown as Project;
}

describe('useScaleStep autosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    saveScale.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves a valid change once typing pauses, not before', () => {
    const { result } = renderHook(() => useScaleStep(savedProject(), image));

    act(() => result.current.setFields({ facadeWidthFt: 31 }));
    expect(result.current.isSaving).toBe(true);

    act(() => vi.advanceTimersByTime(SCALE_AUTOSAVE_DELAY_MS - 1));
    expect(saveScale).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(saveScale).toHaveBeenCalledOnce();
    expect(saveScale.mock.calls[0][0]).toMatchObject({ facadeWidthFt: 31, facadeHeightFt: 20 });
  });

  it('waits for the last keystroke when typing continues', () => {
    const { result } = renderHook(() => useScaleStep(savedProject(), image));

    act(() => result.current.setFields({ facadeWidthFt: 3 }));
    act(() => vi.advanceTimersByTime(SCALE_AUTOSAVE_DELAY_MS / 2));
    act(() => result.current.setFields({ facadeWidthFt: 32 }));
    act(() => vi.advanceTimersByTime(SCALE_AUTOSAVE_DELAY_MS));

    expect(saveScale).toHaveBeenCalledOnce();
    expect(saveScale.mock.calls[0][0]).toMatchObject({ facadeWidthFt: 32 });
  });

  it('never saves values that are not usable, and says why', () => {
    const { result } = renderHook(() => useScaleStep(savedProject(), image));

    act(() => result.current.setFields({ facadeWidthFt: null }));
    act(() => vi.advanceTimersByTime(SCALE_AUTOSAVE_DELAY_MS * 3));

    expect(saveScale).not.toHaveBeenCalled();
    expect(result.current.problem).not.toBeNull();
  });

  it('saves a pending change straight away when the step is left', () => {
    const { result, unmount } = renderHook(() => useScaleStep(savedProject(), image));

    act(() => result.current.setFields({ facadeHeightFt: 22 }));
    unmount();

    expect(saveScale).toHaveBeenCalledOnce();
    expect(saveScale.mock.calls[0][0]).toMatchObject({ facadeHeightFt: 22 });
  });

  it('does not send the same values twice', () => {
    const { result, unmount } = renderHook(() => useScaleStep(savedProject(), image));

    act(() => result.current.setFields({ facadeWidthFt: 31 }));
    act(() => vi.advanceTimersByTime(SCALE_AUTOSAVE_DELAY_MS * 3));
    unmount();

    expect(saveScale).toHaveBeenCalledOnce();
  });

  it('does nothing when nothing changed', () => {
    const { unmount } = renderHook(() => useScaleStep(savedProject(), image));

    act(() => vi.advanceTimersByTime(SCALE_AUTOSAVE_DELAY_MS * 3));
    unmount();

    expect(saveScale).not.toHaveBeenCalled();
  });
});
