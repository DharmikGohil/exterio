import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTypewriter } from '@/presentation/features/advisor/hooks/useTypewriter';

const REPLY = 'Stone cladding lasts decades but costs more than texture paint. '.repeat(10);

/** Runs frames one at a time, so each frame's update renders before the next is scheduled. */
function playFrames(milliseconds: number) {
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 16) {
    act(() => {
      vi.advanceTimersByTime(16);
    });
  }
}

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('types a reply out and finishes a long reply within three seconds', () => {
    const { result } = renderHook(() => useTypewriter(REPLY, true));
    expect(result.current.text).toBe('');

    playFrames(300);
    expect(result.current.text.length).toBeGreaterThan(0);
    expect(result.current.isTyping).toBe(true);

    playFrames(2700);
    expect(result.current).toEqual({ text: REPLY, isTyping: false });
  });

  it('shows the text at once when not animating', () => {
    const { result } = renderHook(() => useTypewriter(REPLY, false));

    expect(result.current).toEqual({ text: REPLY, isTyping: false });
  });
});
