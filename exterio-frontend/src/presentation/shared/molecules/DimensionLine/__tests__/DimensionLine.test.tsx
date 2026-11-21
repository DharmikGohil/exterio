import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DimensionLine } from '@/presentation/shared/molecules/DimensionLine';

describe('DimensionLine', () => {
  it('shows the figure between the two end values', () => {
    render(
      <DimensionLine start="₹60,467" end="₹70,983">
        ±8%
      </DimensionLine>
    );

    expect(screen.getByText('₹60,467')).toBeInTheDocument();
    expect(screen.getByText('±8%')).toBeInTheDocument();
    expect(screen.getByText('₹70,983')).toBeInTheDocument();
  });

  it('uses the cream tints on the cutting mat', () => {
    render(<DimensionLine tone="mat">30 ft</DimensionLine>);

    expect(screen.getByText('30 ft')).toHaveClass('text-mat-ink');
  });
});
