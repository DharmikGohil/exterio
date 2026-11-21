import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DemoAccountCard } from '@/presentation/features/auth/molecules/DemoAccountCard';

const account = { email: 'demo@example.com', password: 'review-2026' };

describe('DemoAccountCard', () => {
  it('shows the demo email and password in full', () => {
    render(<DemoAccountCard account={account} onSignIn={vi.fn()} isSigningIn={false} />);

    expect(screen.getByText('demo@example.com')).toBeInTheDocument();
    expect(screen.getByText('review-2026')).toBeInTheDocument();
  });

  it('signs in with one click', async () => {
    const onSignIn = vi.fn();
    render(<DemoAccountCard account={account} onSignIn={onSignIn} isSigningIn={false} />);

    await userEvent.click(screen.getByRole('button', { name: /sign in with the demo account/i }));

    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it('shows why signing in failed', () => {
    render(
      <DemoAccountCard
        account={account}
        onSignIn={vi.fn()}
        isSigningIn={false}
        errorMessage="The server is not reachable."
      />
    );

    expect(screen.getByText('The server is not reachable.')).toBeInTheDocument();
  });
});
