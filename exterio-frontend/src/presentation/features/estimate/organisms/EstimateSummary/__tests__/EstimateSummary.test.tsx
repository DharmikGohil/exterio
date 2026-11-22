import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EstimateSummary } from '@/presentation/features/estimate/organisms/EstimateSummary';

const TOTALS = {
  materialCost: 44865,
  labourCost: 16140,
  grandTotal: 61005,
  lowEstimate: 56124,
  highEstimate: 65885,
};

describe('EstimateSummary', () => {
  it('shows the total, its likely range and the split', () => {
    render(
      <EstimateSummary
        totals={TOTALS}
        confidencePct={8}
        scaleBasis="a wall of 30 × 20 ft"
        isRefreshing={false}
        onAdjustScale={vi.fn()}
        onOpenBreakdown={vi.fn()}
      />
    );

    expect(screen.getByText('₹61,005')).toBeInTheDocument();
    expect(screen.getByText('Most likely between ₹56,124 and ₹65,885')).toBeInTheDocument();
    expect(screen.getByText('₹44,865')).toBeInTheDocument();
    expect(screen.getByText('₹16,140')).toBeInTheDocument();
    expect(screen.getByText('a wall of 30 × 20 ft')).toBeInTheDocument();
    expect(screen.getByText('within ±8%')).toBeInTheDocument();
    expect(screen.getByText('· 74%')).toBeInTheDocument();
    expect(screen.getByText('· 26%')).toBeInTheDocument();
  });

  it('goes back to the scale step to adjust the size', async () => {
    const onAdjustScale = vi.fn();
    render(
      <EstimateSummary
        totals={TOTALS}
        confidencePct={8}
        scaleBasis="a wall of 30 × 20 ft"
        isRefreshing={false}
        onAdjustScale={onAdjustScale}
        onOpenBreakdown={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Adjust size' }));

    expect(onAdjustScale).toHaveBeenCalledOnce();
  });

  it('opens the full breakdown from right under the total', async () => {
    const onOpenBreakdown = vi.fn();
    render(
      <EstimateSummary
        totals={TOTALS}
        confidencePct={8}
        scaleBasis="a wall of 30 × 20 ft"
        isRefreshing={false}
        onAdjustScale={vi.fn()}
        onOpenBreakdown={onOpenBreakdown}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'See the full breakdown' }));

    expect(onOpenBreakdown).toHaveBeenCalledOnce();
  });

  it('asks for the size when the estimate rests on a rough one', async () => {
    const onAdjustScale = vi.fn();
    render(
      <EstimateSummary
        totals={TOTALS}
        confidencePct={8}
        scaleBasis="a rough guess"
        isRefreshing={false}
        isRoughSize
        onAdjustScale={onAdjustScale}
        onOpenBreakdown={vi.fn()}
      />
    );

    expect(screen.getByText('Rough total')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Set the size' }));

    expect(onAdjustScale).toHaveBeenCalledOnce();
  });
});
