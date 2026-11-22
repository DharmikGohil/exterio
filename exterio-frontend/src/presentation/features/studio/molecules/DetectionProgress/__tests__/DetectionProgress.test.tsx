import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  DetectionProgress,
  type DetectionRevealStatus,
} from '@/presentation/features/studio/molecules/DetectionProgress';

const IDLE: DetectionRevealStatus = {
  isActive: false,
  isDone: false,
  shown: 0,
  total: 0,
  latestLabel: null,
};

describe('DetectionProgress', () => {
  it('says what the AI is looking for while it runs', () => {
    render(<DetectionProgress isDetecting reveal={IDLE} />);

    expect(screen.getByRole('status')).toHaveTextContent('Sending the photo to the AI');
    expect(screen.getByRole('status')).toHaveTextContent('0 s');
  });

  it('counts the parts as they are drawn, then says it is done', () => {
    const { rerender } = render(
      <DetectionProgress
        isDetecting={false}
        reveal={{ isActive: true, isDone: false, shown: 3, total: 9, latestLabel: 'window' }}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Found 3 parts');
    expect(screen.getByRole('status')).toHaveTextContent('Finding windows, doors and the garage');

    rerender(
      <DetectionProgress
        isDetecting={false}
        reveal={{ isActive: true, isDone: true, shown: 9, total: 9, latestLabel: 'fence' }}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('All done: 9 parts found');
  });

  it('shows nothing when detection is not running', () => {
    render(<DetectionProgress isDetecting={false} reveal={IDLE} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
