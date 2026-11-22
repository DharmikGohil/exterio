import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DesignCostSummary } from '@/presentation/features/design/molecules/DesignCostSummary';

const TOTALS = {
  materialCost: 40000,
  labourCost: 16000,
  grandTotal: 56000,
  lowEstimate: 45000,
  highEstimate: 67000,
};

describe('DesignCostSummary', () => {
  it('calls the total rough and points to the size step until a real size is given', () => {
    render(
      <DesignCostSummary
        totals={TOTALS}
        isLoading={false}
        isRefreshing={false}
        hasError={false}
        isRough
      />
    );

    expect(screen.getByText('Rough total')).toBeInTheDocument();
    expect(screen.getByText('Add a real size in the next step')).toBeInTheDocument();
  });

  it('shows a plain estimated total once the size is set', () => {
    render(
      <DesignCostSummary
        totals={TOTALS}
        isLoading={false}
        isRefreshing={false}
        hasError={false}
        isRough={false}
      />
    );

    expect(screen.getByText('Estimated total')).toBeInTheDocument();
    expect(screen.queryByText('Add a real size in the next step')).not.toBeInTheDocument();
  });
});
