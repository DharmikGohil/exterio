import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';
import { formatInr } from '@/presentation/shared/utils/format';
import type { EstimateTotals } from '@/domain/models/estimate';

export interface EstimateSummaryProps {
  totals: EstimateTotals;
  /** Completes "Based on …", e.g. "a wall of 30 × 20 ft". */
  scaleBasis: string;
  /** Dims the figures while a new estimate is on its way. */
  isRefreshing: boolean;
  onAdjustScale: () => void;
  /** Opens every line, quantity and rate behind the total. */
  onOpenBreakdown: () => void;
}

/** The one figure that matters, its likely range, the split, and what the sizes rest on. */
export function EstimateSummary({
  totals,
  scaleBasis,
  isRefreshing,
  onAdjustScale,
  onOpenBreakdown,
}: EstimateSummaryProps) {
  return (
    <section
      aria-label="Estimate summary"
      aria-busy={isRefreshing}
      className="flex flex-wrap items-center gap-x-10 gap-y-5 rounded-2xl border border-stone-200 bg-white px-7 py-6"
    >
      <div className={cn('min-w-0 transition-opacity', isRefreshing && 'opacity-50')}>
        <p className="text-[15px] text-stone-600">Estimated total</p>
        <p className="text-[52px] font-medium leading-none tracking-[-0.02em] text-stone-900">
          {formatInr(totals.grandTotal)}
        </p>
        <p className="mt-2 text-[15px] text-stone-600">
          Most likely between {formatInr(totals.lowEstimate)} and {formatInr(totals.highEstimate)}
        </p>
        <button
          type="button"
          onClick={onOpenBreakdown}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md text-[15px] font-medium text-brand-700 underline-offset-4 transition-colors hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          See the full breakdown
          <Icon name="arrow-right" className="h-4 w-4" />
        </button>
      </div>

      <dl className={cn('flex gap-3 transition-opacity lg:mx-auto', isRefreshing && 'opacity-50')}>
        <div className="rounded-xl bg-stone-100 px-5 py-3">
          <dt className="text-sm text-stone-600">Materials</dt>
          <dd className="text-xl font-medium tabular-nums text-stone-900">
            {formatInr(totals.materialCost)}
          </dd>
        </div>
        <div className="rounded-xl bg-stone-100 px-5 py-3">
          <dt className="text-sm text-stone-600">Labour</dt>
          <dd className="text-xl font-medium tabular-nums text-stone-900">
            {formatInr(totals.labourCost)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center gap-4 lg:ml-auto">
        <p className="text-[15px] leading-snug text-stone-600">
          Based on
          <br />
          <span className="font-medium text-stone-900">{scaleBasis}</span>
        </p>
        <Button variant="outline" size="lg" onClick={onAdjustScale}>
          Adjust size
        </Button>
      </div>
    </section>
  );
}
