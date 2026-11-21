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
}

/** The running cost of the active design, shown in the Design step header. */
export function DesignCostSummary({
  totals,
  isLoading,
  isRefreshing,
  hasError,
}: DesignCostSummaryProps) {
  return (
    <div aria-live="polite" className="min-w-[10rem] text-right">
      <div>
        <p className="text-xs text-stone-500">Estimated total</p>
        {isLoading && <Skeleton className="ml-auto mt-1 h-7 w-28" />}
        {!isLoading && totals && (
          <>
            <p
              className={cn(
                'text-2xl leading-tight text-stone-900 transition-opacity',
                isRefreshing && 'opacity-50'
              )}
            >
              {formatInr(totals.grandTotal)}
            </p>
            <p className="font-mono text-xs text-stone-500">
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
