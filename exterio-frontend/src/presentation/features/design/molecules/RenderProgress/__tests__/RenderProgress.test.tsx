import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RenderProgress } from '@/presentation/features/design/molecules/RenderProgress';
import {
  SLOW_RENDER_SECONDS,
  renderStageAt,
} from '@/presentation/features/design/utils/renderStages';

describe('RenderProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks through the stages and calls out a slow render', () => {
    expect(renderStageAt(0)).toBe('Sending your design to the AI');
    expect(renderStageAt(8)).toBe('Matching the light and shadows');
    expect(renderStageAt(SLOW_RENDER_SECONDS)).toMatch(/backup renderer/);
  });

  it('shows the stage and the seconds while a render runs', () => {
    render(<RenderProgress isActive />);
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Adding real texture to each finish');
    expect(screen.getByRole('status')).toHaveTextContent('4 s');
  });

  it('shows nothing when no render is running', () => {
    render(<RenderProgress isActive={false} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
