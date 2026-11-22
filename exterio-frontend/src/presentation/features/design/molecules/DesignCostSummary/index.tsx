import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { cn } from '@/presentation/shared/utils/cn';
import { formatInr } from '@/presentation/shared/utils/format';
import type { EstimateTotals } from '@/domain/models/estimate';

export interface DesignCostSummaryProps {
  totals: EstimateTotals | undefined;
  isLoading: boolean;
  /** `true` while the number is being recalculated. */
  isRefreshing: boolean;
  hasError: boolean;
  /** No real size yet: the figure rests on an assumed storey height. */
  isRough: boolean;
}

/** The running cost of the active design, shown in the Design step header. */
export function DesignCostSummary({
  totals,
  isLoading,
  isRefreshing,
  hasError,
  isRough,
}: DesignCostSummaryProps) {
  return (
    <div aria-live="polite" data-tour="design-cost" className="min-w-[10rem] text-right">
      <div>
        <p
          className="text-sm text-stone-500"
          title={
            isRough ? 'No real size yet. Add one in the Scale step for a closer figure.' : undefined
          }
        >
          {isRough ? 'Rough total · no size yet' : 'Estimated total'}
        </p>
        {isLoading && <Skeleton className="ml-auto mt-1 h-10 w-36" />}
        {!isLoading && totals && (
          <>
            <p
              className={cn(
                'text-4xl font-medium leading-tight tracking-[-0.01em] text-stone-900 transition-opacity',
                isRefreshing && 'opacity-50'
              )}
            >
              {formatInr(totals.grandTotal)}
            </p>
            <p className="text-sm text-stone-500">
              {formatInr(totals.lowEstimate)} – {formatInr(totals.highEstimate)}
            </p>
          </>
        )}
        {!isLoading && !totals && (
          <p className="text-sm text-stone-500">{hasError ? 'Not available' : '—'}</p>
        )}
      </div>
    </div>
  );
}
