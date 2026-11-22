import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Region } from '@/domain/models/project';
import {
  MERGE_WINDOW_MS,
  useRegionDraft,
} from '@/presentation/features/studio/hooks/useRegionDraft';

const WALL = {
  id: 'wall-1',
  label: 'wall',
  name: 'Front wall',
  polygon: [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ],
  source: 'auto',
  surfaceMultiplier: 1,
} as unknown as Region;
const SAVED = [WALL];

describe('useRegionDraft undo and redo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-22T10:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('undoes a whole corner drag in one step and redoes it', () => {
    const { result } = renderHook(() => useRegionDraft(SAVED));

    for (const x of [10, 20, 30, 40]) {
      act(() => result.current.moveVertex('wall-1', 0, [x, 0]));
      vi.advanceTimersByTime(16);
    }
    expect(result.current.regions[0].polygon[0]).toEqual([40, 0]);

    act(() => result.current.undo());
    expect(result.current.regions[0].polygon[0]).toEqual([0, 0]);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.regions[0].polygon[0]).toEqual([40, 0]);
  });

  it('keeps two separate drags of the same corner as two steps', () => {
    const { result } = renderHook(() => useRegionDraft(SAVED));

    act(() => result.current.moveVertex('wall-1', 0, [10, 0]));
    vi.advanceTimersByTime(MERGE_WINDOW_MS + 1);
    act(() => result.current.moveVertex('wall-1', 0, [20, 0]));

    act(() => result.current.undo());
    expect(result.current.regions[0].polygon[0]).toEqual([10, 0]);
  });

  it('brings back a deleted region and undoes a discard', () => {
    const { result } = renderHook(() => useRegionDraft(SAVED));

    act(() => result.current.deleteRegion('wall-1'));
    expect(result.current.regions).toHaveLength(0);
    act(() => result.current.undo());
    expect(result.current.regions).toHaveLength(1);

    act(() => result.current.updateRegion('wall-1', { name: 'Garage wall' }));
    act(() => result.current.discardChanges());
    expect(result.current.regions[0].name).toBe('Front wall');
    act(() => result.current.undo());
    expect(result.current.regions[0].name).toBe('Garage wall');
  });

  it('forgets what was undone once a new change is made', () => {
    const { result } = renderHook(() => useRegionDraft(SAVED));

    act(() => result.current.deleteRegion('wall-1'));
    act(() => result.current.undo());
    act(() => result.current.updateRegion('wall-1', { name: 'Side wall' }));

    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndo).toBe(true);
  });
});
