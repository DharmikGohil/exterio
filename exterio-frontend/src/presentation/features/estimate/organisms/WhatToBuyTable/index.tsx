import { Button } from '@/presentation/shared/atoms/Button';
import { InlineNumberCell } from '@/presentation/shared/molecules/InlineNumberCell';
import { formatInr, formatNumber } from '@/presentation/shared/utils/format';
import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';
import type { RateField } from '@/presentation/features/estimate/hooks/useRateOverrides';
import { Cell, DataTable, HeaderCell } from '@/presentation/features/estimate/molecules/DataTable';
import { describeUses, describeWaste } from '@/presentation/features/estimate/utils/estimateCopy';
import type { EstimateLine, EstimateRegion, EstimateTotals } from '@/domain/models/estimate';
import { REGION_LABELS, type RateOverrides } from '@/domain/models/project';

export interface WhatToBuyTableProps {
  lines: EstimateLine[];
  /** The estimate's per-part rows, to say where each material goes. */
  regions: EstimateRegion[];
  totals: EstimateTotals;
  /** The project's saved overrides, used to highlight edited rates. */
  overrides: RateOverrides;
  /** Changes whenever fresh numbers arrive from the server. */
  syncToken: number;
  onRateChange: (materialId: string, field: RateField, value: number) => void;
  onReset: (materialId: string) => void;
}

/**
 * One line per material, in a homeowner's words: what it is and where it goes, how much to buy,
 * the two rates (editable, for when a contractor quotes something else) and what it costs.
 */
export function WhatToBuyTable({
  lines,
  regions,
  totals,
  overrides,
  syncToken,
  onRateChange,
  onReset,
}: WhatToBuyTableProps) {
  if (lines.length === 0) {
    return (
      <p className="px-6 py-8 text-[15px] text-stone-600">
        No finishes are chosen in this design yet, so there is nothing to buy.
      </p>
    );
  }

  return (
    <DataTable caption="What to buy and what it costs" minWidthClassName="min-w-[56rem]">
      <thead>
        <tr>
          <HeaderCell className="pl-6">Item and where it goes</HeaderCell>
          <HeaderCell>You need</HeaderCell>
          <HeaderCell numeric>Material rate (₹)</HeaderCell>
          <HeaderCell numeric>Labour rate (₹)</HeaderCell>
          <HeaderCell numeric className="pr-6">
            Cost
          </HeaderCell>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => {
          const override = overrides[line.materialId];
          const per = line.unit === 'rft' ? 'per running ft' : 'per sq ft';
          return (
            <tr key={line.materialId}>
              <Cell className="py-4 pl-6">
                <span className="block text-[15px] font-medium text-stone-900">
                  {line.materialName}
                </span>
                <span className="block text-sm text-stone-600">
                  {describeUses(
                    line.materialId,
                    regions,
                    REGION_LABELS,
                    (label) => REGION_LABEL_META[label].plural
                  )}
                </span>
              </Cell>
              <Cell className="py-4">
                <span className="block text-[15px] text-stone-900">
                  {formatNumber(line.purchaseQuantity, 2)} {line.purchaseUnit}
                </span>
                <span className="block max-w-[15rem] text-sm leading-snug text-stone-600">
                  {describeWaste(line)}
                </span>
              </Cell>
              <Cell numeric className="py-4">
                <InlineNumberCell
                  value={line.materialRate}
                  syncToken={syncToken}
                  label={`Material rate for ${line.materialName} in rupees ${per}`}
                  highlighted={override?.materialRate !== undefined}
                  className="ml-auto w-28"
                  onCommit={(value) => onRateChange(line.materialId, 'materialRate', value)}
                />
                <span className="mt-1 block text-xs text-stone-500">{per}</span>
              </Cell>
              <Cell numeric className="py-4">
                <InlineNumberCell
                  value={line.labourRate}
                  syncToken={syncToken}
                  label={`Labour rate for ${line.materialName} in rupees ${per}`}
                  highlighted={override?.labourRate !== undefined}
                  className="ml-auto w-28"
                  onCommit={(value) => onRateChange(line.materialId, 'labourRate', value)}
                />
                <span className="mt-1 block text-xs text-stone-500">{per}</span>
              </Cell>
              <Cell numeric className="py-4 pr-6">
                <span className="block text-base font-medium text-stone-900">
                  {formatInr(line.total)}
                </span>
                <span className="block text-sm text-stone-600">
                  {formatInr(line.materialCost)} material · {formatInr(line.labourCost)} labour
                </span>
                {override && (
                  <Button
                    variant="link"
                    size="inline"
                    className="mt-1 text-xs"
                    aria-label={`Reset rates for ${line.materialName} to the typical rates`}
                    onClick={() => onReset(line.materialId)}
                  >
                    Use typical rates
                  </Button>
                )}
              </Cell>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="bg-stone-50">
          <Cell className="py-4 pl-6 text-base font-medium text-stone-900">Total</Cell>
          <Cell />
          <Cell />
          <Cell />
          <Cell numeric className="py-4 pr-6">
            <span className="block text-lg font-medium text-stone-900">
              {formatInr(totals.grandTotal)}
            </span>
            <span className="block text-sm text-stone-600">
              {formatInr(totals.materialCost)} material · {formatInr(totals.labourCost)} labour
            </span>
          </Cell>
        </tr>
      </tfoot>
    </DataTable>
  );
}
