import type { ReactNode } from 'react';

import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';
import { formatInr } from '@/presentation/shared/utils/format';
import type { EstimateTotals } from '@/domain/models/estimate';

export interface EstimateSummaryProps {
  totals: EstimateTotals;
  /** How far the total could be off either way, in percent (from the scale method). */
  confidencePct: number;
  /** Completes "Based on …", e.g. "a wall of 30 × 20 ft". */
  scaleBasis: string;
  /** Dims the figures while a new estimate is on its way. */
  isRefreshing: boolean;
  /** No real size yet, so the areas rest on an assumed storey height. */
  isRoughSize?: boolean;
  onAdjustScale: () => void;
  /** Opens every line, quantity and rate behind the total. */
  onOpenBreakdown: () => void;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">{children}</h3>
  );
}

/** Where `value` sits between `low` and `high`, from 0 to 100. */
function positionPct(value: number, low: number, high: number): number {
  if (high <= low) {
    return 50;
  }
  return Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100));
}

/**
 * Three columns: the one figure that matters, what it is made of (materials against labour),
 * and how sure we are (the likely range, and the size it rests on).
 */
export function EstimateSummary({
  totals,
  confidencePct,
  scaleBasis,
  isRefreshing,
  isRoughSize = false,
  onAdjustScale,
  onOpenBreakdown,
}: EstimateSummaryProps) {
  const sum = totals.materialCost + totals.labourCost;
  const materialPct = sum > 0 ? Math.round((totals.materialCost / sum) * 100) : 0;
  const labourPct = sum > 0 ? 100 - materialPct : 0;
  const dim = cn('transition-opacity', isRefreshing && 'opacity-50');

  return (
    <section
      data-tour="estimate-summary"
      aria-label="Estimate summary"
      aria-busy={isRefreshing}
      className="grid divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white md:grid-cols-3 md:divide-x md:divide-y-0"
    >
      <div className="flex flex-col gap-1 p-6">
        <Eyebrow>{isRoughSize ? 'Rough total' : 'Estimated total'}</Eyebrow>
        <p
          className={cn(
            'mt-1 text-[52px] font-medium leading-none tracking-[-0.02em] text-stone-900',
            dim
          )}
        >
          {formatInr(totals.grandTotal)}
        </p>
        <p className="text-sm text-stone-600">for materials and labour together</p>
        <div className="mt-auto pt-4">
          <Button variant="outline" onClick={onOpenBreakdown}>
            See the full breakdown
            <Icon name="arrow-right" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <Eyebrow>What it is made of</Eyebrow>
        <div aria-hidden className={cn('flex h-3 overflow-hidden rounded-full bg-stone-100', dim)}>
          <div className="bg-brand-700" style={{ width: `${materialPct}%` }} />
          <div className="bg-brand-200" style={{ width: `${labourPct}%` }} />
        </div>
        <dl className={cn('space-y-2.5', dim)}>
          {[
            {
              label: 'Materials',
              pct: materialPct,
              cost: totals.materialCost,
              dot: 'bg-brand-700',
            },
            { label: 'Labour', pct: labourPct, cost: totals.labourCost, dot: 'bg-brand-200' },
          ].map((part) => (
            <div key={part.label} className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-sm text-stone-700">
                <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', part.dot)} />
                {part.label}
                <span className="text-stone-500">· {part.pct}%</span>
              </dt>
              <dd className="text-[17px] font-semibold tabular-nums text-stone-900">
                {formatInr(part.cost)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-3 p-6">
        <Eyebrow>How sure we are</Eyebrow>
        <div className={dim}>
          <p className="sr-only">
            Most likely between {formatInr(totals.lowEstimate)} and {formatInr(totals.highEstimate)}
          </p>
          <div aria-hidden className="relative mx-2 mt-1 h-2 rounded-full bg-brand-100">
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-700 shadow-card"
              style={{
                left: `${positionPct(totals.grandTotal, totals.lowEstimate, totals.highEstimate)}%`,
              }}
            />
          </div>
          <div
            aria-hidden
            className="mt-2 flex items-center justify-between text-xs text-stone-600"
          >
            <span className="tabular-nums">{formatInr(totals.lowEstimate)}</span>
            <span className="font-semibold text-stone-900">
              within ±{Math.round(confidencePct)}%
            </span>
            <span className="tabular-nums">{formatInr(totals.highEstimate)}</span>
          </div>
        </div>
        <p className="text-sm leading-snug text-stone-600">
          Based on <span className="font-semibold text-stone-900">{scaleBasis}</span>.{' '}
          {isRoughSize
            ? 'One real measurement narrows the range a lot.'
            : 'A closer measurement narrows the range.'}
        </p>
        <div className="mt-auto">
          <Button variant={isRoughSize ? 'primary' : 'outline'} onClick={onAdjustScale}>
            {isRoughSize ? 'Set the size' : 'Adjust size'}
          </Button>
        </div>
      </div>
    </section>
  );
}
