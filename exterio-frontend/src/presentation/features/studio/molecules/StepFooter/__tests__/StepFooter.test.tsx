import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';

describe('StepFooter', () => {
  it('moves to the next and previous step', async () => {
    const onStepChange = vi.fn();
    render(<StepFooter step="regions" onStepChange={onStepChange} />);

    await userEvent.click(screen.getByRole('button', { name: /continue to design/i }));
    await userEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(onStepChange).toHaveBeenNthCalledWith(1, 'design');
    expect(onStepChange).toHaveBeenNthCalledWith(2, 'photo');
  });

  it('offers only Back on the last step', () => {
    render(<StepFooter step="estimate" onStepChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('shows the main action and wording of the last step', () => {
    render(
      <StepFooter
        step="estimate"
        onStepChange={vi.fn()}
        meta="Step 4 of 4 · Estimates are advisory"
        primaryAction={<button type="button">Download PDF report</button>}
      />
    );

    expect(screen.getByText('Step 4 of 4 · Estimates are advisory')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF report' })).toBeInTheDocument();
  });

  it('shows the hint and makes Continue secondary while work is unsaved', () => {
    render(<StepFooter step="regions" onStepChange={vi.fn()} hint="Save your regions first" />);

    expect(screen.getByText('Save your regions first')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to design/i })).toHaveClass('border');
  });
});
