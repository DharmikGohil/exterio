import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GrandTotalCard } from '@/presentation/features/estimate/organisms/GrandTotalCard';
import type { EstimateCategory, EstimateTotals } from '@/domain/models/estimate';

const totals: EstimateTotals = {
  materialCost: 49092,
  labourCost: 18917,
  grandTotal: 68009,
  lowEstimate: 62568,
  highEstimate: 73450,
};

const categories: EstimateCategory[] = [
  { category: 'paint', materialCost: 7831, labourCost: 6393, total: 14224 },
  { category: 'stone', materialCost: 17868, labourCost: 5830, total: 23698 },
  { category: 'glass_railing', materialCost: 19570, labourCost: 4000, total: 23570 },
];

describe('GrandTotalCard', () => {
  it('shows the total, its likely range and the material and labour split', () => {
    render(
      <GrandTotalCard
        totals={totals}
        categories={categories}
        confidencePct={8}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('₹68,009')).toBeInTheDocument();
    expect(screen.getByText('₹62,568')).toBeInTheDocument();
    expect(screen.getByText('₹73,450')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /materials 72% of the total, labour 28%/i })
    ).toBeInTheDocument();
  });

  it('writes the range on the mat in its cream tone', () => {
    render(
      <GrandTotalCard
        totals={totals}
        categories={categories}
        confidencePct={8}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('±8%')).toHaveClass('text-mat-ink');
  });

  it('ranks categories by cost, largest first', () => {
    render(
      <GrandTotalCard
        totals={totals}
        categories={categories}
        confidencePct={8}
        isRefreshing={false}
      />
    );

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent?.split('₹')[0])).toEqual([
      'Stone cladding',
      'Glass railing',
      'Paint',
    ]);
  });
});
