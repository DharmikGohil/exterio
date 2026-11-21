import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Input } from '@/presentation/shared/atoms/Input';
import { Select } from '@/presentation/shared/atoms/Select';
import { FormField } from '@/presentation/shared/molecules/FormField';
import { NumberField } from '@/presentation/shared/molecules/NumberField';
import { cn } from '@/presentation/shared/utils/cn';
import type { RegionPatch } from '@/presentation/features/studio/hooks/useRegionDraft';
import {
  REGION_LABEL_META,
  REGION_LABEL_OPTIONS,
  isRegionLabel,
  usesSurfaceMultiplier,
} from '@/presentation/shared/utils/regionLabels';
import type { Region } from '@/domain/models/project';

export interface RegionListItemProps {
  region: Region;
  isSelected: boolean;
  onSelect: (regionId: string) => void;
  onChange: (regionId: string, patch: RegionPatch) => void;
  onDelete: (regionId: string) => void;
}

/** One region in the side panel. Selecting it reveals its editable details. */
export function RegionListItem({
  region,
  isSelected,
  onSelect,
  onChange,
  onDelete,
}: RegionListItemProps) {
  const nameId = `region-name-${region.id}`;
  const labelId = `region-label-${region.id}`;

  const { color } = REGION_LABEL_META[region.label];

  return (
    <li className={cn('group rounded-lg', isSelected && 'bg-stone-100')}>
      <div className="flex h-9 items-center gap-1 pr-1">
        <button
          type="button"
          aria-expanded={isSelected}
          onClick={() => onSelect(region.id)}
          className={cn(
            'flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 text-left text-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            !isSelected && 'hover:bg-stone-100'
          )}
        >
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span
            className={cn('truncate', isSelected ? 'font-medium text-stone-900' : 'text-stone-800')}
          >
            {region.name}
          </span>
          {region.source === 'auto' && (
            <span className="ml-auto font-mono text-[11px] text-stone-400" title="Found by the AI">
              AI
            </span>
          )}
        </button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${region.name}`}
          className={cn(
            'h-7 w-7 text-stone-400 hover:bg-red-50 hover:text-red-700',
            !isSelected && 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100'
          )}
          onClick={() => onDelete(region.id)}
        >
          <Icon name="trash" />
        </Button>
      </div>

      {isSelected && (
        <div className="space-y-3 pb-3 pl-7 pr-3 pt-1">
          <FormField label="Name" htmlFor={nameId}>
            <Input
              id={nameId}
              inputSize="sm"
              maxLength={60}
              value={region.name}
              onChange={(event) => onChange(region.id, { name: event.target.value })}
            />
          </FormField>
          <FormField label="Type" htmlFor={labelId}>
            <Select
              id={labelId}
              selectSize="sm"
              options={REGION_LABEL_OPTIONS}
              value={region.label}
              onChange={(event) => {
                if (isRegionLabel(event.target.value)) {
                  onChange(region.id, { label: event.target.value });
                }
              }}
            />
          </FormField>
          {usesSurfaceMultiplier(region.label) && (
            <NumberField
              label="Exposed faces"
              value={region.surfaceMultiplier}
              min={1}
              max={8}
              step={1}
              hint="A photo shows one face of a pillar. If 3 sides will be finished, enter 3 and the area is multiplied by 3."
              onChange={(value) => onChange(region.id, { surfaceMultiplier: value ?? 1 })}
            />
          )}
        </div>
      )}
    </li>
  );
}
