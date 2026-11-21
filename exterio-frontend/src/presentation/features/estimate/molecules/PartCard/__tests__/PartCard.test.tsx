import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PartCard } from '@/presentation/features/estimate/molecules/PartCard';
import type { PartGroup } from '@/presentation/features/estimate/utils/partGroups';

const PILLARS: PartGroup = {
  label: 'pillar',
  title: 'Two pillars',
  color: '#ef4444',
  finishLines: ['Sandstone cladding - Ashlar'],
  measure: '70 sq ft',
  totalCost: 22927,
  isUnpriced: false,
  anchor: { x: 0.4, y: 0.7 },
  side: 'left',
};

describe('PartCard', () => {
  it('shows what goes on the part, how much and what it costs', () => {
    render(<PartCard group={PILLARS} />);

    expect(screen.getByRole('heading', { name: 'Two pillars' })).toBeInTheDocument();
    expect(screen.getByText('Sandstone cladding - Ashlar')).toBeInTheDocument();
    expect(screen.getByText('70 sq ft')).toBeInTheDocument();
    expect(screen.getByText('₹22,927')).toBeInTheDocument();
  });

  it('says a part without a finish is not in the estimate', () => {
    render(
      <PartCard
        group={{
          ...PILLARS,
          title: 'Five windows',
          isUnpriced: true,
          finishLines: ['No finish chosen yet'],
        }}
      />
    );

    expect(screen.getByText('Not in estimate')).toBeInTheDocument();
    expect(screen.queryByText('₹22,927')).not.toBeInTheDocument();
  });

  it('is marked for its leader line', () => {
    const { container } = render(<PartCard group={PILLARS} />);

    expect(container.firstElementChild).toHaveAttribute('data-part-card', 'pillar');
    expect(container.firstElementChild).toHaveAttribute('data-side', 'left');
  });
});
