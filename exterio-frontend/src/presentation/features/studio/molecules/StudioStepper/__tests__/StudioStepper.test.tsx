import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { StudioStepper } from '@/presentation/features/studio/molecules/StudioStepper';

describe('StudioStepper', () => {
  it('ticks done steps, fills the current one and numbers the rest', () => {
    render(<StudioStepper currentStep="scale" hasPhoto onStepChange={vi.fn()} />);

    const done = screen.getByRole('button', { name: /regions/i });
    const current = screen.getByRole('button', { name: /scale/i });
    const upcoming = screen.getByRole('button', { name: /design/i });

    expect(done.querySelector('svg')).not.toBeNull();
    expect(done).not.toHaveTextContent('2');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).toHaveClass('bg-brand-700');
    expect(current).toHaveTextContent('3');
    expect(upcoming).toHaveTextContent('4');
    expect(upcoming).not.toHaveAttribute('aria-current');
  });

  it('locks the later steps until there is a photo', async () => {
    const onStepChange = vi.fn();
    render(<StudioStepper currentStep="photo" hasPhoto={false} onStepChange={onStepChange} />);

    expect(screen.getByRole('button', { name: /regions/i })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /photo/i }));
    expect(onStepChange).toHaveBeenCalledWith('photo');
  });
});
