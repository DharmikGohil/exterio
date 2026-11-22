import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AdvisorStep } from '@/domain/models/advisor';
import { AdvisorSteps } from '@/presentation/features/advisor/molecules/AdvisorSteps';

const steps: AdvisorStep[] = [
  { key: 'notes', label: 'Searched material notes', status: 'done', detail: 'Found 2 notes' },
  { key: 'project', label: 'Checked your house', status: 'done', detail: '“Villa”: ₹66,026' },
  { key: 'answer', label: 'Writing the answer', status: 'running', detail: '' },
];

describe('AdvisorSteps', () => {
  it('shows every step and what it found while the answer is arriving', () => {
    render(<AdvisorSteps steps={steps} isWorking />);

    expect(screen.getByText('Found 2 notes')).toBeInTheDocument();
    expect(screen.getByText('Writing the answer')).toBeInTheDocument();
  });

  it('folds into one line once answered and opens again on request', () => {
    render(<AdvisorSteps steps={steps} isWorking={false} />);

    expect(screen.queryByText('Found 2 notes')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Searched material notes · Checked your house/ })
    );

    expect(screen.getByText('Found 2 notes')).toBeInTheDocument();
  });
});
