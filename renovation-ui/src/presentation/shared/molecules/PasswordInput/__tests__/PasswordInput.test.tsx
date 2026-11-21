import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PasswordInput } from '@/presentation/shared/molecules/PasswordInput';

describe('PasswordInput', () => {
  it('hides the password until the eye button is pressed, then hides it again', async () => {
    render(<PasswordInput aria-label="Password" defaultValue="review-2026" />);
    const field = screen.getByLabelText('Password');

    expect(field).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field).toHaveAttribute('type', 'password');
  });

  it('does not submit the form when the eye button is pressed', async () => {
    let submitted = false;
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = true;
        }}
      >
        <PasswordInput aria-label="Password" />
      </form>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));

    expect(submitted).toBe(false);
  });
});
