import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { StudioStepper } from '@/presentation/features/studio/molecules/StudioStepper';

function badgeOf(name: RegExp) {
  return screen.getByRole('button', { name }).firstElementChild;
}

describe('StudioStepper', () => {
  it('gives every step the same round badge, styled by its state', () => {
    render(<StudioStepper currentStep="scale" hasPhoto onStepChange={vi.fn()} />);

    const done = badgeOf(/regions/i);
    const current = badgeOf(/scale/i);
    const upcoming = badgeOf(/design/i);

    for (const badge of [done, current, upcoming]) {
      expect(badge).toHaveClass('h-5', 'w-5', 'rounded-full', 'border');
    }
    expect(done).toHaveClass('bg-brand-50');
    expect(current).toHaveClass('bg-brand-700');
    expect(upcoming).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /scale/i })).toHaveAttribute('aria-current', 'step');
  });

  it('locks the later steps until there is a photo', async () => {
    const onStepChange = vi.fn();
    render(<StudioStepper currentStep="photo" hasPhoto={false} onStepChange={onStepChange} />);

    expect(screen.getByRole('button', { name: /regions/i })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /photo/i }));
    expect(onStepChange).toHaveBeenCalledWith('photo');
  });
});
