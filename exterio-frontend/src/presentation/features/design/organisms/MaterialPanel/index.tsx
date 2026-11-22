import type { ReactNode } from 'react';

import { Badge } from '@/presentation/shared/atoms/Badge';
import { Button } from '@/presentation/shared/atoms/Button';
import { ColorDot } from '@/presentation/shared/atoms/ColorDot';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { ErrorState } from '@/presentation/shared/molecules/ErrorState';
import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';
import { MaterialCard } from '@/presentation/features/materials/molecules/MaterialCard';
import {
  MATERIAL_CATEGORY_LABELS,
  groupMaterialsForLabel,
  indexMaterialsById,
} from '@/presentation/features/materials/utils/materialCatalog';
import { groupRegionsByLabel } from '@/presentation/features/studio/utils/regionDraft';
import type { DesignAssignments } from '@/domain/models/design';
import type { Material } from '@/domain/models/material';
import type { Region } from '@/domain/models/project';

const SKELETON_KEYS = ['a', 'b', 'c', 'd'] as const;

export interface MaterialPanelProps {
  regions: Region[];
  selectedRegion: Region | null;
  assignments: DesignAssignments;
  materials: Material[];
  isLoadingMaterials: boolean;
  materialsError: unknown;
  onRetryMaterials: () => void;
  /** `true` while a change is being saved and the preview re-rendered. */
  isUpdating: boolean;
  onSelectRegion: (regionId: string | null) => void;
  onHoverRegion: (regionId: string | null) => void;
  onAssign: (regionIds: string[], materialId: string) => void;
  onClear: (regionIds: string[]) => void;
  /** Shown at the right of the panel title, e.g. the material advisor button. */
  headerAction?: ReactNode;
  /** As tall as the photo may be, so the panel never pushes the step bar off screen. */
  maxHeight?: string;
}

/**
 * Right-hand panel of the Design step.
 * With nothing selected it lists every part and its finish; with a part selected it shows
 * the finishes that suit that kind of part.
 */
export function MaterialPanel({
  regions,
  selectedRegion,
  assignments,
  materials,
  isLoadingMaterials,
  materialsError,
  onRetryMaterials,
  isUpdating,
  onSelectRegion,
  onHoverRegion,
  onAssign,
  onClear,
  headerAction,
  maxHeight,
}: MaterialPanelProps) {
  const materialsById = indexMaterialsById(materials);

  if (!selectedRegion) {
    return (
      <aside
        style={{ maxHeight }}
        className="flex max-h-[max(22rem,calc(100dvh-22rem))] min-h-64 flex-col self-start overflow-hidden rounded-2xl border border-stone-200 bg-white lg:sticky lg:top-6"
      >
        <div className="mx-4 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-stone-200 px-1 py-3">
          <h3 className="whitespace-nowrap text-lg font-medium text-stone-900">
            Parts of the house
            <span className="ml-1.5 text-sm font-normal text-stone-500">· {regions.length}</span>
          </h3>
          {headerAction}
        </div>
        <div className="overflow-y-auto px-2 pb-3">
          {groupRegionsByLabel(regions).map((group) => (
            <section key={group.label} className="pt-3">
              <h4 className="flex h-7 items-center px-3 text-xs font-medium uppercase tracking-[0.08em] text-stone-500">
                {REGION_LABEL_META[group.label].plural} · {group.regions.length}
              </h4>
              <ul className="space-y-0.5">
                {group.regions.map((region) => {
                  const material = materialsById.get(assignments[region.id] ?? '');
                  // Windows and doors take no finish; they are only subtracted from the wall.
                  const isOpening = region.label === 'window' || region.label === 'door';
                  return (
                    <li key={region.id}>
                      <button
                        type="button"
                        onClick={() => onSelectRegion(region.id)}
                        onPointerEnter={() => onHoverRegion(region.id)}
                        onPointerLeave={() => onHoverRegion(null)}
                        className="flex h-14 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        {material ? (
                          <img
                            src={resolveFileUrl(material.swatchUrl)}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-stone-200 object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="h-10 w-10 shrink-0 rounded-lg border border-dashed border-stone-300"
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium text-stone-900">
                            {region.name}
                          </span>
                          <span className="block truncate text-xs text-stone-500">
                            {material
                              ? material.name
                              : isOpening
                                ? 'Opening, taken off the wall'
                                : 'No finish yet'}
                          </span>
                        </span>
                        <Icon name="chevron-right" className="text-stone-400" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    );
  }

  const labelMeta = REGION_LABEL_META[selectedRegion.label];
  const assignedMaterialId = assignments[selectedRegion.id];
  const assignedMaterial = assignedMaterialId ? materialsById.get(assignedMaterialId) : undefined;
  const sameLabelRegionIds = regions
    .filter((region) => region.label === selectedRegion.label)
    .map((region) => region.id);
  const groups = groupMaterialsForLabel(materials, selectedRegion.label);

  return (
    <aside
      style={{ maxHeight }}
      className="flex max-h-[max(22rem,calc(100dvh-22rem))] min-h-64 flex-col self-start overflow-hidden rounded-2xl border border-stone-200 bg-white lg:sticky lg:top-6"
    >
      <div className="shrink-0 space-y-3 border-b border-stone-200 px-5 py-4">
        <Button variant="link" size="inline" icon="arrow-left" onClick={() => onSelectRegion(null)}>
          All parts
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-medium text-stone-900">{selectedRegion.name}</h3>
          <Badge>
            <ColorDot color={labelMeta.color} className="h-2 w-2" />
            {labelMeta.label}
          </Badge>
        </div>
        <p className="text-sm text-stone-600">
          {assignedMaterial ? (
            <>
              Finish: <span className="font-medium text-stone-900">{assignedMaterial.name}</span>
            </>
          ) : (
            'No finish applied yet. Pick one below.'
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            icon="layers"
            disabled={!assignedMaterialId || sameLabelRegionIds.length < 2}
            onClick={() => assignedMaterialId && onAssign(sameLabelRegionIds, assignedMaterialId)}
          >
            Apply to all {labelMeta.plural.toLowerCase()}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon="reset"
            disabled={!assignedMaterialId}
            onClick={() => onClear([selectedRegion.id])}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-5 overflow-y-auto p-4" aria-busy={isUpdating}>
        {isLoadingMaterials && (
          <div className="grid grid-cols-2 gap-3">
            {SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="h-32 rounded-xl" />
            ))}
          </div>
        )}

        {Boolean(materialsError) && (
          <ErrorState
            title="We could not load the finishes"
            error={materialsError}
            onRetry={onRetryMaterials}
          />
        )}

        {!isLoadingMaterials && !materialsError && groups.length === 0 && (
          <p className="text-sm leading-relaxed text-stone-500">
            There are no finishes in the catalog for a {labelMeta.label.toLowerCase()}. If this part
            is something else, change its type in the Regions step.
          </p>
        )}

        {groups.map((group) => (
          <section key={group.category} className="space-y-2">
            <h4 className="text-xs font-medium text-stone-500">
              {MATERIAL_CATEGORY_LABELS[group.category]}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {group.materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  isSelected={material.id === assignedMaterialId}
                  onSelect={(picked) => onAssign([selectedRegion.id], picked.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
