import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BlurReveal } from '@/presentation/shared/atoms/BlurReveal';

describe('BlurReveal', () => {
  it('reads as one sentence and staggers the words', () => {
    const { container } = render(
      <BlurReveal as="h1" text="See your house" delayMs={100} stepMs={50} />
    );

    expect(screen.getByRole('heading', { name: 'See your house' })).toBeInTheDocument();
    const words = container.querySelectorAll('.animate-blur-in');
    expect([...words].map((word) => word.textContent)).toEqual(['See', 'your', 'house']);
    expect((words[2] as HTMLElement).style.animationDelay).toBe('200ms');
  });
});
