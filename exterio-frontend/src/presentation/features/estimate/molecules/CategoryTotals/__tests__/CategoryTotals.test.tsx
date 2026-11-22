import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CategoryTotals } from '@/presentation/features/estimate/molecules/CategoryTotals';

describe('CategoryTotals', () => {
  it('shows each category with its total and split, largest first', () => {
    render(
      <CategoryTotals
        grandTotal={10000}
        categories={[
          { category: 'paint', materialCost: 1500, labourCost: 1000, total: 2500 },
          { category: 'stone', materialCost: 6000, labourCost: 1500, total: 7500 },
        ]}
      />
    );

    const cards = within(screen.getByRole('region', { name: 'Cost by category' })).getAllByRole(
      'listitem'
    );
    expect(cards[0]).toHaveTextContent('75%');
    expect(cards[0]).toHaveTextContent('₹7,500');
    expect(cards[1]).toHaveTextContent('Materials ₹1,500 · Labour ₹1,000');
  });
});
