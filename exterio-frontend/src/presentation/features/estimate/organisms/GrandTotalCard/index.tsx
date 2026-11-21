import { DimensionLine } from '@/presentation/shared/molecules/DimensionLine';
import { MatPanel } from '@/presentation/shared/molecules/MatPanel';
import { cn } from '@/presentation/shared/utils/cn';
import { formatInr } from '@/presentation/shared/utils/format';
import { MATERIAL_CATEGORY_LABELS } from '@/presentation/features/materials/utils/materialCatalog';
import type { EstimateCategory, EstimateTotals } from '@/domain/models/estimate';

export interface GrandTotalCardProps {
  totals: EstimateTotals;
  categories: EstimateCategory[];
  confidencePct: number;
  /** Dimmed while the numbers are being recalculated. */
  isRefreshing: boolean;
}

function percentOf(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

/**
 * The estimate's moment, laid on the cutting mat: the total, its likely range drawn as a
 * dimension line, how it splits between material and labour, and the categories ranked by
 * what they cost. On the mat, cream carries the lead value and its fainter tints the rest.
 */
export function GrandTotalCard({
  totals,
  categories,
  confidencePct,
  isRefreshing,
}: GrandTotalCardProps) {
  const ranked = [...categories].sort((a, b) => b.total - a.total);
  const largest = ranked[0]?.total ?? 0;
  const materialShare = percentOf(totals.materialCost, totals.grandTotal);

  return (
    <MatPanel aria-label="Estimated total">
      <div
        className={cn(
          'grid gap-8 p-6 transition-opacity md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
          isRefreshing && 'opacity-60'
        )}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-mat-line/80">Estimated total</p>
            <p className="text-[40px] leading-none tracking-[-0.02em] text-mat-ink">
              {formatInr(totals.grandTotal)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-mat-line/70">
              Likely range, ±{confidencePct}% from the scale
            </p>
            <DimensionLine
              tone="mat"
              start={formatInr(totals.lowEstimate)}
              end={formatInr(totals.highEstimate)}
            >
              ±{confidencePct}%
            </DimensionLine>
          </div>
          <div className="space-y-2">
            <div
              className="flex h-2 overflow-hidden rounded-sm bg-mat-line/25"
              role="img"
              aria-label={`Materials ${Math.round(materialShare)}% of the total, labour ${Math.round(100 - materialShare)}%`}
            >
              <span className="bg-mat-ink" style={{ width: `${materialShare}%` }} />
            </div>
            <dl className="flex justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-2 w-2 rounded-sm bg-mat-ink" />
                <dt className="text-mat-line/80">Materials</dt>
                <dd className="font-mono text-mat-ink">{formatInr(totals.materialCost)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-2 w-2 rounded-sm bg-mat-line/30" />
                <dt className="text-mat-line/80">Labour</dt>
                <dd className="font-mono text-mat-ink">{formatInr(totals.labourCost)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-3 md:border-l md:border-mat-line/20 md:pl-8">
          <p className="text-sm text-mat-line/80">By category</p>
          {ranked.length === 0 ? (
            <p className="text-sm text-mat-line/70">Apply a finish to see the split</p>
          ) : (
            <ol className="space-y-3">
              {ranked.map((category, index) => (
                <li key={category.category} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-mat-ink">
                      {MATERIAL_CATEGORY_LABELS[category.category]}
                    </span>
                    <span className="font-mono text-mat-ink">{formatInr(category.total)}</span>
                  </div>
                  <div className="h-1 rounded-sm bg-mat-line/15">
                    <div
                      className={cn(
                        'h-1 rounded-sm',
                        index === 0 ? 'bg-mat-ink' : 'bg-mat-line/45'
                      )}
                      style={{ width: `${percentOf(category.total, largest)}%` }}
                    />
                  </div>
                  <p className="font-mono text-xs text-mat-line/65">
                    {formatInr(category.materialCost)} material · {formatInr(category.labourCost)}{' '}
                    labour
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </MatPanel>
  );
}
