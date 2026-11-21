import { Button } from '@/presentation/shared/atoms/Button';
import { InlineNumberCell } from '@/presentation/shared/molecules/InlineNumberCell';
import { formatInr, formatNumber, formatUnit } from '@/presentation/shared/utils/format';
import type { RateField } from '@/presentation/features/estimate/hooks/useRateOverrides';
import { Cell, DataTable, HeaderCell } from '@/presentation/features/estimate/molecules/DataTable';
import { SavingIndicator } from '@/presentation/features/estimate/molecules/SavingIndicator';
import { SectionCard } from '@/presentation/features/estimate/molecules/SectionCard';
import { MATERIAL_CATEGORY_LABELS } from '@/presentation/features/materials/utils/materialCatalog';
import type { EstimateLine } from '@/domain/models/estimate';
import type { RateOverrides } from '@/domain/models/project';

export interface BillOfQuantitiesTableProps {
  lines: EstimateLine[];
  /** The project's saved overrides, used to highlight edited cells. */
  overrides: RateOverrides;
  /** Changes whenever fresh numbers arrive from the server. */
  syncToken: number;
  isSaving: boolean;
  onRateChange: (materialId: string, field: RateField, value: number) => void;
  onReset: (materialId: string) => void;
}

/** One line per material: quantities, what to buy, editable rates and wastage, and costs. */
export function BillOfQuantitiesTable({
  lines,
  overrides,
  syncToken,
  isSaving,
  onRateChange,
  onReset,
}: BillOfQuantitiesTableProps) {
  return (
    <SectionCard
      title="Bill of quantities"
      description="Rates are typical market rates. If your contractor quoted something else, change the material rate, labour rate or wastage and the totals update."
      aside={<SavingIndicator isSaving={isSaving} />}
      flush
    >
      {lines.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-stone-500">
          No finishes are applied in this design yet, so there is nothing to buy.
        </p>
      ) : (
        <DataTable caption="Quantities and costs per material" minWidthClassName="min-w-[78rem]">
          <thead>
            <tr>
              <HeaderCell className="pl-5">Material</HeaderCell>
              <HeaderCell numeric>Net qty</HeaderCell>
              <HeaderCell numeric>Wastage %</HeaderCell>
              <HeaderCell numeric>Gross qty</HeaderCell>
              <HeaderCell>To buy</HeaderCell>
              <HeaderCell numeric>Material rate (₹)</HeaderCell>
              <HeaderCell numeric>Labour rate (₹)</HeaderCell>
              <HeaderCell numeric>Material cost</HeaderCell>
              <HeaderCell numeric>Labour cost</HeaderCell>
              <HeaderCell numeric>Total</HeaderCell>
              <HeaderCell className="pr-5">
                <span className="sr-only">Reset</span>
              </HeaderCell>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const override = overrides[line.materialId];
              const unit = formatUnit(line.unit);
              return (
                <tr key={line.materialId}>
                  <Cell className="pl-5">
                    <span className="block font-medium text-stone-900">{line.materialName}</span>
                    <span className="block text-xs text-stone-500">
                      {MATERIAL_CATEGORY_LABELS[line.category]} · per {unit}
                    </span>
                  </Cell>
                  <Cell numeric>
                    {formatNumber(line.netQuantity)} {unit}
                  </Cell>
                  <Cell numeric>
                    <InlineNumberCell
                      value={line.wastagePct}
                      syncToken={syncToken}
                      label={`Wastage percent for ${line.materialName}`}
                      max={100}
                      highlighted={override?.wastagePct !== undefined}
                      className="ml-auto w-20"
                      onCommit={(value) => onRateChange(line.materialId, 'wastagePct', value)}
                    />
                  </Cell>
                  <Cell numeric>
                    {formatNumber(line.grossQuantity)} {unit}
                  </Cell>
                  <Cell>
                    <span className="block whitespace-nowrap font-medium text-stone-900">
                      {formatNumber(line.purchaseQuantity, 2)} {line.purchaseUnit}
                    </span>
                    {line.purchaseNote && (
                      <span className="block max-w-[16rem] text-xs leading-snug text-stone-500">
                        {line.purchaseNote}
                      </span>
                    )}
                  </Cell>
                  <Cell numeric>
                    <InlineNumberCell
                      value={line.materialRate}
                      syncToken={syncToken}
                      label={`Material rate for ${line.materialName} in rupees per ${unit}`}
                      highlighted={override?.materialRate !== undefined}
                      className="ml-auto"
                      onCommit={(value) => onRateChange(line.materialId, 'materialRate', value)}
                    />
                  </Cell>
                  <Cell numeric>
                    <InlineNumberCell
                      value={line.labourRate}
                      syncToken={syncToken}
                      label={`Labour rate for ${line.materialName} in rupees per ${unit}`}
                      highlighted={override?.labourRate !== undefined}
                      className="ml-auto"
                      onCommit={(value) => onRateChange(line.materialId, 'labourRate', value)}
                    />
                  </Cell>
                  <Cell numeric>{formatInr(line.materialCost)}</Cell>
                  <Cell numeric>{formatInr(line.labourCost)}</Cell>
                  <Cell numeric className="font-medium text-stone-900">
                    {formatInr(line.total)}
                  </Cell>
                  <Cell className="pr-5 text-right">
                    {override && (
                      <Button
                        variant="link"
                        size="inline"
                        aria-label={`Reset rates for ${line.materialName} to the catalog values`}
                        onClick={() => onReset(line.materialId)}
                      >
                        Reset
                      </Button>
                    )}
                  </Cell>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </SectionCard>
  );
}
