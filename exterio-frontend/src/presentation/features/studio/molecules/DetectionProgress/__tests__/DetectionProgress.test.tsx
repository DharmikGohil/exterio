import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DetectionProgress } from '@/presentation/features/studio/molecules/DetectionProgress';

describe('DetectionProgress', () => {
  it('shows what the AI is looking for while it runs', () => {
    render(<DetectionProgress isActive />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Finding the parts of your house')).toBeInTheDocument();
    expect(screen.getByText('Sending the photo to the AI')).toBeInTheDocument();
  });

  it('shows nothing when detection is not running', () => {
    render(<DetectionProgress isActive={false} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
