import { Badge } from '@/presentation/shared/atoms/Badge';
import { Button } from '@/presentation/shared/atoms/Button';
import { ColorDot } from '@/presentation/shared/atoms/ColorDot';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Tooltip } from '@/presentation/shared/atoms/Tooltip';
import { InlineNumberCell } from '@/presentation/shared/molecules/InlineNumberCell';
import { formatNumber, pluralise } from '@/presentation/shared/utils/format';
import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';
import { Cell, DataTable, HeaderCell } from '@/presentation/features/estimate/molecules/DataTable';
import { SavingIndicator } from '@/presentation/features/estimate/molecules/SavingIndicator';
import { SectionCard } from '@/presentation/features/estimate/molecules/SectionCard';
import type { EstimateRegion, EstimateSurface } from '@/domain/models/estimate';
import type { Region } from '@/domain/models/project';

export interface SurfacesTableProps {
  rows: EstimateRegion[];
  /** Totals per type of surface, shown above the table. */
  surfaces: EstimateSurface[];
  /** The project's regions, used to tell which measurement was typed by the user. */
  regions: Region[];
  /** Changes whenever fresh numbers arrive from the server. */
  syncToken: number;
  isSaving: boolean;
  onAreaChange: (regionId: string, areaSqft: number) => void;
  onLengthChange: (regionId: string, lengthFt: number) => void;
  onReset: (regionId: string) => void;
}

/** Every marked part with its measured area and length; both can be overridden inline. */
export function SurfacesTable({
  rows,
  surfaces,
  regions,
  syncToken,
  isSaving,
  onAreaChange,
  onLengthChange,
  onReset,
}: SurfacesTableProps) {
  const regionsById = new Map(regions.map((region) => [region.id, region]));

  return (
    <SectionCard
      title="Surfaces"
      description="Measured from the regions you marked and the scale. If you know the real figure, type it in and the estimate will use yours."
      aside={<SavingIndicator isSaving={isSaving} />}
      flush
    >
      {surfaces.length > 0 && (
        <ul className="flex flex-wrap gap-2 px-5 pb-4">
          {surfaces.map((surface) => (
            <li
              key={surface.label}
              className="flex h-7 items-center gap-2 rounded-md border border-stone-200 px-2.5 text-xs text-stone-700"
            >
              <ColorDot color={REGION_LABEL_META[surface.label].color} />
              <span className="font-medium">
                {pluralise(
                  surface.count,
                  REGION_LABEL_META[surface.label].label.toLowerCase(),
                  REGION_LABEL_META[surface.label].plural.toLowerCase()
                )}
              </span>
              <span className="font-mono text-stone-500">
                {formatNumber(surface.areaSqft)} sq ft
                {surface.lengthFt > 0 && ` · ${formatNumber(surface.lengthFt)} ft`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {rows.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-stone-500">No regions have been marked yet.</p>
      ) : (
        <DataTable
          caption="Area and length of every marked region"
          minWidthClassName="min-w-[44rem]"
        >
          <thead>
            <tr>
              <HeaderCell className="pl-5">Part</HeaderCell>
              <HeaderCell>Type</HeaderCell>
              <HeaderCell numeric>Area (sq ft)</HeaderCell>
              <HeaderCell numeric>Length (ft)</HeaderCell>
              <HeaderCell>Finish</HeaderCell>
              <HeaderCell className="pr-5">
                <span className="sr-only">Reset</span>
              </HeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const region = regionsById.get(row.regionId);
              const hasAreaOverride = region ? region.areaOverrideSqft !== null : false;
              const hasLengthOverride = region ? region.lengthOverrideFt !== null : false;
              // The project's regions update instantly; the estimate row follows after a refetch.
              const isOverridden = region ? hasAreaOverride || hasLengthOverride : row.isOverride;
              return (
                <tr key={row.regionId} className={isOverridden ? 'bg-brand-50/40' : undefined}>
                  <Cell className="pl-5 font-medium text-stone-900">
                    <span className="flex items-center gap-2">
                      {row.name}
                      {isOverridden && <Badge tone="brand">Your figure</Badge>}
                    </span>
                  </Cell>
                  <Cell>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <ColorDot color={REGION_LABEL_META[row.label].color} />
                      {REGION_LABEL_META[row.label].label}
                    </span>
                  </Cell>
                  <Cell numeric>
                    <InlineNumberCell
                      value={row.areaSqft}
                      syncToken={syncToken}
                      label={`Area of ${row.name} in square feet`}
                      highlighted={hasAreaOverride}
                      className="ml-auto"
                      onCommit={(value) => onAreaChange(row.regionId, value)}
                    />
                  </Cell>
                  <Cell numeric>
                    <InlineNumberCell
                      value={row.lengthFt}
                      syncToken={syncToken}
                      label={`Length of ${row.name} in feet`}
                      highlighted={hasLengthOverride}
                      className="ml-auto"
                      onCommit={(value) => onLengthChange(row.regionId, value)}
                    />
                  </Cell>
                  <Cell>
                    {row.materialName ?? <span className="text-stone-400">No finish</span>}
                  </Cell>
                  <Cell className="pr-5 text-right">
                    {isOverridden && (
                      <Tooltip content="Use the measured figures again">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Reset ${row.name} to the measured area and length`}
                          onClick={() => onReset(row.regionId)}
                        >
                          <Icon name="reset" />
                        </Button>
                      </Tooltip>
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
