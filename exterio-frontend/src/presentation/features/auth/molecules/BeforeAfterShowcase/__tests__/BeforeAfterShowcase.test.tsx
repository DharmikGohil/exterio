import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { BeforeAfterShowcase } from '@/presentation/features/auth/molecules/BeforeAfterShowcase';

describe('BeforeAfterShowcase', () => {
  it('shows the first house before and after, with its design', () => {
    render(<BeforeAfterShowcase />);

    expect(screen.getByAltText('Single-storey ranch as it is today')).toHaveAttribute(
      'src',
      '/showcase/ranch-before.jpg'
    );
    expect(
      screen.getByAltText('Single-storey ranch with the White farmhouse design')
    ).toHaveAttribute('src', '/showcase/ranch-after.jpg');
    expect(screen.getByText('Single-storey ranch · White farmhouse')).toBeInTheDocument();
  });

  it('moves to the next house when the sweep finishes, and wraps round', () => {
    render(<BeforeAfterShowcase />);

    for (let step = 0; step < 4; step += 1) {
      fireEvent.animationEnd(screen.getByTestId('showcase-after'));
    }

    expect(screen.getByText('Single-storey ranch · White farmhouse')).toBeInTheDocument();
  });

  it('goes straight to a house from its dot', async () => {
    render(<BeforeAfterShowcase />);

    await userEvent.click(screen.getByRole('button', { name: 'Show the Craftsman with stone' }));

    expect(
      screen.getByText('Craftsman with stone · Sage, cream and sandstone')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show the Craftsman with stone' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
