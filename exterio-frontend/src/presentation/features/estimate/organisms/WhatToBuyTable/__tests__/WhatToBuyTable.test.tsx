import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WhatToBuyTable } from '@/presentation/features/estimate/organisms/WhatToBuyTable';
import type { EstimateLine, EstimateRegion } from '@/domain/models/estimate';

const LINE: EstimateLine = {
  materialId: 'paint-cream',
  materialName: 'Warm Cream paint',
  category: 'paint',
  unit: 'sqft',
  netQuantity: 91,
  wastagePct: 5,
  grossQuantity: 95.55,
  purchaseQuantity: 2,
  purchaseUnit: 'litre',
  purchaseNote: '',
  materialRate: 14,
  labourRate: 12,
  materialCost: 1338,
  labourCost: 1092,
  total: 2430,
};

const REGION: EstimateRegion = {
  regionId: 'r1',
  label: 'wall',
  name: 'Front wall',
  areaSqft: 91,
  lengthFt: 0,
  isOverride: false,
  materialId: 'paint-cream',
  materialName: 'Warm Cream paint',
  materialCost: 1338,
  labourCost: 1092,
  totalCost: 2430,
};

const TOTALS = {
  materialCost: 1338,
  labourCost: 1092,
  grandTotal: 2430,
  lowEstimate: 2200,
  highEstimate: 2600,
};

function renderTable(overrides = {}) {
  const onReset = vi.fn();
  render(
    <WhatToBuyTable
      lines={[LINE]}
      regions={[REGION]}
      totals={TOTALS}
      overrides={overrides}
      syncToken={1}
      onRateChange={vi.fn()}
      onReset={onReset}
    />
  );
  return { onReset };
}

describe('WhatToBuyTable', () => {
  it('says what to buy, where it goes and what it costs', () => {
    renderTable();

    expect(screen.getByText('Warm Cream paint')).toBeInTheDocument();
    expect(screen.getByText('Front wall')).toBeInTheDocument();
    expect(screen.getByText('2 litre')).toBeInTheDocument();
    expect(screen.getByText('91 sq ft plus 5% extra for waste')).toBeInTheDocument();
    expect(screen.getByLabelText(/Material rate for Warm Cream paint/)).toHaveValue(14);
    const footer = screen.getByText('Total').closest('tr');
    expect(within(footer as HTMLElement).getByText('₹2,430')).toBeInTheDocument();
  });

  it('offers the typical rates back only for an edited material', () => {
    renderTable();
    expect(screen.queryByText('Use typical rates')).not.toBeInTheDocument();
  });

  it('resets an edited material to the typical rates', async () => {
    const { onReset } = renderTable({ 'paint-cream': { materialRate: 18 } });

    await userEvent.click(screen.getByRole('button', { name: /Reset rates for Warm Cream paint/ }));

    expect(onReset).toHaveBeenCalledWith('paint-cream');
  });

  it('says so when nothing is to be bought', () => {
    render(
      <WhatToBuyTable
        lines={[]}
        regions={[]}
        totals={TOTALS}
        overrides={{}}
        syncToken={1}
        onRateChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText(/nothing to buy/)).toBeInTheDocument();
  });
});
