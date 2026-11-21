import type { ReactNode } from 'react';

import { Badge } from '@/presentation/shared/atoms/Badge';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { cn } from '@/presentation/shared/utils/cn';
import { formatInr } from '@/presentation/shared/utils/format';
import {
  useDesignEstimates,
  type DesignEstimateSummary,
} from '@/presentation/features/estimate/hooks/useDesignEstimates';
import { Cell, DataTable, HeaderCell } from '@/presentation/features/estimate/molecules/DataTable';
import { SectionCard } from '@/presentation/features/estimate/molecules/SectionCard';
import type { Design } from '@/domain/models/design';
import type { EstimateTotals } from '@/domain/models/estimate';

interface CompareRow {
  label: string;
  render: (totals: EstimateTotals) => ReactNode;
  emphasised?: boolean;
}

const ROWS: CompareRow[] = [
  { label: 'Materials', render: (totals) => formatInr(totals.materialCost) },
  { label: 'Labour', render: (totals) => formatInr(totals.labourCost) },
  { label: 'Grand total', render: (totals) => formatInr(totals.grandTotal), emphasised: true },
  {
    label: 'Likely range',
    render: (totals) => `${formatInr(totals.lowEstimate)} – ${formatInr(totals.highEstimate)}`,
  },
];

function findLowestTotalDesignId(summaries: DesignEstimateSummary[]): string | null {
  const priced = summaries.filter((summary) => summary.totals && summary.totals.grandTotal > 0);
  if (priced.length < 2) {
    return null;
  }
  return priced.reduce((lowest, summary) =>
    (summary.totals?.grandTotal ?? Infinity) < (lowest.totals?.grandTotal ?? Infinity)
      ? summary
      : lowest
  ).design.id;
}

export interface CompareDesignsProps {
  designs: Design[];
  activeDesignId: string;
  onSelectDesign: (designId: string) => void;
}

/** Side-by-side totals: one column per design. */
export function CompareDesigns({ designs, activeDesignId, onSelectDesign }: CompareDesignsProps) {
  const summaries = useDesignEstimates(designs);
  const lowestId = findLowestTotalDesignId(summaries);

  return (
    <SectionCard
      title="Compare designs"
      description={
        designs.length > 1
          ? 'Tap a design name to see its full estimate above.'
          : 'You have one design so far. Duplicate it in the Design step and change a few finishes to compare costs here.'
      }
      flush
    >
      <DataTable caption="Cost comparison of all designs" minWidthClassName="min-w-[32rem]">
        <thead>
          <tr>
            <HeaderCell className="pl-5">
              <span className="sr-only">Cost</span>
            </HeaderCell>
            {summaries.map(({ design }) => (
              <HeaderCell key={design.id} numeric className="normal-case tracking-normal">
                <button
                  type="button"
                  onClick={() => onSelectDesign(design.id)}
                  className={cn(
                    'rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    design.id === activeDesignId
                      ? 'text-brand-800'
                      : 'text-stone-700 underline-offset-4 hover:underline'
                  )}
                >
                  {design.name}
                </button>
                <span className="mt-1 flex justify-end gap-1">
                  {design.id === activeDesignId && <Badge tone="brand">Shown above</Badge>}
                  {design.id === lowestId && <Badge tone="success">Lowest cost</Badge>}
                </span>
              </HeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <Cell className="pl-5 font-medium text-stone-900">{row.label}</Cell>
              {summaries.map(({ design, totals, isLoading, hasError }) => (
                <Cell
                  key={design.id}
                  numeric
                  className={cn(row.emphasised && 'text-base font-medium text-stone-900')}
                >
                  {isLoading && <Skeleton className="ml-auto h-5 w-20" />}
                  {!isLoading && totals && row.render(totals)}
                  {!isLoading && !totals && (
                    <span className="text-stone-400">{hasError ? 'Unavailable' : '—'}</span>
                  )}
                </Cell>
              ))}
            </tr>
          ))}
        </tbody>
      </DataTable>
    </SectionCard>
  );
}
