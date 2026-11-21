import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthLayout } from '@/presentation/shared/layouts/AuthLayout';

describe('AuthLayout', () => {
  it('splits the screen: the story on the left, the form on white on the right', () => {
    render(
      <AuthLayout visual={<p>Product story</p>}>
        <form aria-label="Sign in form" />
      </AuthLayout>
    );

    const story = screen.getByText('Product story').closest('aside');
    expect(story).toHaveClass('hidden', 'lg:block');
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('form'));
    const shell = story?.parentElement;
    expect(shell).toHaveClass('bg-white', 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]');
  });

  it('keeps the advisory note at the bottom', () => {
    render(
      <AuthLayout visual={null}>
        <span />
      </AuthLayout>
    );

    expect(screen.getByRole('contentinfo')).toHaveTextContent(/estimates are advisory/i);
  });

  it('anchors the form to the top, so switching tabs does not move it', () => {
    render(
      <AuthLayout visual={null}>
        <span />
      </AuthLayout>
    );

    expect(screen.getByRole('main')).not.toHaveClass('items-center');
  });
});
