import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DetectionProgress } from '@/presentation/features/studio/molecules/DetectionProgress';

describe('DetectionProgress', () => {
  it('says what the AI is looking at before the first part arrives', () => {
    render(<DetectionProgress isRunning found={0} latestLabel={null} doneCount={null} />);

    expect(screen.getByRole('status')).toHaveTextContent('Sending the photo to the AI');
    expect(screen.getByRole('status')).toHaveTextContent('0 s');
  });

  it('counts the parts live as the AI finds them, then says it is done', () => {
    const { rerender } = render(
      <DetectionProgress isRunning found={3} latestLabel="window" doneCount={null} />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Found 3 parts');
    expect(screen.getByRole('status')).toHaveTextContent('Finding windows, doors and the garage');

    rerender(<DetectionProgress isRunning={false} found={0} latestLabel={null} doneCount={9} />);
    expect(screen.getByRole('status')).toHaveTextContent('All done: 9 parts found');
  });

  it('shows nothing when detection is not running', () => {
    render(<DetectionProgress isRunning={false} found={0} latestLabel={null} doneCount={null} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
