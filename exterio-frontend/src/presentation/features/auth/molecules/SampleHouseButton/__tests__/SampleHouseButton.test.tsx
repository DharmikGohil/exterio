import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SampleHouseButton } from '@/presentation/features/auth/molecules/SampleHouseButton';

describe('SampleHouseButton', () => {
  it('opens a sample house with one click', async () => {
    const onClick = vi.fn();
    render(<SampleHouseButton onClick={onClick} isLoading={false} />);

    await userEvent.click(screen.getByRole('button', { name: 'Try it with a sample house' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText(/No sign-up needed/)).toBeInTheDocument();
  });

  it('shows why it could not sign in', () => {
    render(<SampleHouseButton onClick={vi.fn()} isLoading={false} errorMessage="Server is down" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Server is down');
  });
});
