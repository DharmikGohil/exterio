import type { EstimateCategory } from '@/domain/models/estimate';
import { MATERIAL_CATEGORY_LABELS } from '@/presentation/features/materials/utils/materialCatalog';
import { formatInr } from '@/presentation/shared/utils/format';

export interface CategoryTotalsProps {
  categories: EstimateCategory[];
  grandTotal: number;
}

/**
 * The total for each kind of material (paint, stone, tiles, railings…), split into materials and
 * labour, with a bar for its share of the whole, largest first.
 */
export function CategoryTotals({ categories, grandTotal }: CategoryTotalsProps) {
  if (categories.length === 0) {
    return null;
  }
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  return (
    <section aria-label="Cost by category" className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">
        Cost by category
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sorted.map((category) => {
          const share = grandTotal > 0 ? category.total / grandTotal : 0;
          return (
            <li
              key={category.category}
              className="space-y-2 rounded-2xl border border-stone-200 bg-white px-5 py-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] font-medium text-stone-900">
                  {MATERIAL_CATEGORY_LABELS[category.category]}
                </p>
                <p className="text-xs tabular-nums text-stone-500">{Math.round(share * 100)}%</p>
              </div>
              <p className="text-xl font-medium tabular-nums text-stone-900">
                {formatInr(category.total)}
              </p>
              <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${Math.max(2, Math.round(share * 100))}%` }}
                />
              </div>
              <p className="text-xs tabular-nums text-stone-500">
                Materials {formatInr(category.materialCost)} · Labour{' '}
                {formatInr(category.labourCost)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
