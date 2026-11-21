import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import type { RegionPatch } from '@/presentation/features/studio/hooks/useRegionDraft';
import { RegionListItem } from '@/presentation/features/studio/molecules/RegionListItem';
import { groupRegionsByLabel } from '@/presentation/features/studio/utils/regionDraft';
import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';
import type { Region } from '@/domain/models/project';

const SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export interface RegionListPanelProps {
  regions: Region[];
  selectedRegionId: string | null;
  /** While the AI is detecting, the list shows skeleton rows. */
  isLoading?: boolean;
  onSelect: (regionId: string) => void;
  onChange: (regionId: string, patch: RegionPatch) => void;
  onDelete: (regionId: string) => void;
}

/** Side panel: every region grouped by type. Selecting one opens its details in place. */
export function RegionListPanel({
  regions,
  selectedRegionId,
  isLoading = false,
  onSelect,
  onChange,
  onDelete,
}: RegionListPanelProps) {
  const groups = groupRegionsByLabel(regions);

  return (
    <aside className="flex max-h-[max(25rem,calc(100dvh-21rem))] min-h-64 flex-col self-start overflow-hidden rounded-xl border border-stone-200 bg-white lg:sticky lg:top-20">
      <div className="flex h-12 items-center justify-between border-b border-stone-200 px-4">
        <h3 className="text-[15px] font-medium text-stone-900">Regions</h3>
        {!isLoading && (
          <span className="font-mono text-xs font-medium text-stone-500">{regions.length}</span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-1 p-2" aria-busy="true" aria-label="Finding regions">
          <Skeleton className="mx-2 mb-2 mt-2 h-3 w-16" />
          {SKELETON_ROWS.map((key, index) => (
            <div key={key} className="flex h-9 items-center gap-2.5 px-2">
              <Skeleton className="h-2.5 w-2.5 rounded-sm" />
              <Skeleton className={index % 3 === 0 ? 'h-3.5 w-24' : 'h-3.5 w-16'} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <p className="px-4 py-6 text-sm leading-relaxed text-stone-600">
          Nothing marked yet. Use Auto-detect, or choose Draw region and click around a wall, window
          or pillar on the photo
        </p>
      )}

      {!isLoading && groups.length > 0 && (
        <div className="overflow-y-auto px-2 pb-2">
          {groups.map((group) => (
            <section key={group.label} className="pt-3">
              <h4 className="flex h-6 items-center justify-between px-2 text-xs text-stone-500">
                {REGION_LABEL_META[group.label].plural}
                <span className="font-mono">{group.regions.length}</span>
              </h4>
              <ul className="space-y-0.5">
                {group.regions.map((region) => (
                  <RegionListItem
                    key={region.id}
                    region={region}
                    isSelected={region.id === selectedRegionId}
                    onSelect={onSelect}
                    onChange={onChange}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}
