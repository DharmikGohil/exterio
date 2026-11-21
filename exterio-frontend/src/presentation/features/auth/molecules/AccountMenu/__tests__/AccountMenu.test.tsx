import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AccountMenu } from '@/presentation/features/auth/molecules/AccountMenu';
import type { User } from '@/domain/models/auth';

const reviewer: User = {
  id: 'u1',
  name: 'Demo reviewer',
  email: 'demo@example.com',
  isGuest: false,
};

describe('AccountMenu', () => {
  it('shows only the avatar until it is opened', () => {
    render(<AccountMenu user={reviewer} onSignOut={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: 'Account: Demo reviewer' });
    expect(trigger).toHaveTextContent('DR');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens to the account name, email and sign out', async () => {
    const onSignOut = vi.fn();
    render(<AccountMenu user={reviewer} onSignOut={onSignOut} />);

    await userEvent.click(screen.getByRole('button', { name: /account/i }));
    const menu = screen.getByRole('menu');
    expect(menu).toHaveTextContent('Demo reviewer');
    expect(menu).toHaveTextContent('demo@example.com');

    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('closes on Escape and on a click outside', async () => {
    render(
      <>
        <AccountMenu user={reviewer} onSignOut={vi.fn()} />
        <p>Elsewhere</p>
      </>
    );
    const trigger = screen.getByRole('button', { name: /account/i });

    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByText('Elsewhere'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('says a guest session is saved in this browser', async () => {
    render(
      <AccountMenu
        user={{ id: 'g1', name: 'Guest', email: null, isGuest: true }}
        onSignOut={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /account/i }));

    expect(screen.getByRole('menu')).toHaveTextContent('Guest, saved in this browser');
  });
});
