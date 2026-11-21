import { useState } from 'react';

import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';
import { formatInr, formatUnit } from '@/presentation/shared/utils/format';
import { MaterialSwatch } from '@/presentation/features/materials/molecules/MaterialSwatch';
import type { Material } from '@/domain/models/material';

export interface MaterialCardProps {
  material: Material;
  isSelected: boolean;
  onSelect: (material: Material) => void;
}

/** A swatch card: tap to apply the material, tap the info button for durability and upkeep. */
export function MaterialCard({ material, isSelected, onSelect }: MaterialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = `material-details-${material.id}`;
  const unit = formatUnit(material.unit);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-white transition-shadow',
        isSelected ? 'border-brand-600 ring-1 ring-brand-600' : 'border-stone-200 hover:shadow-card'
      )}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(material)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <MaterialSwatch
          swatchUrl={material.swatchUrl}
          colorHex={material.colorHex}
          className="h-16 w-full"
        />
        <span className="block space-y-0.5 p-2.5 pr-8">
          <span className="block truncate text-sm font-medium text-stone-900">{material.name}</span>
          <span className="block text-xs text-stone-600">
            <span className="font-medium text-stone-800">{formatInr(material.materialRate)}</span> /{' '}
            {unit}
          </span>
          <span className="block text-xs text-stone-500">
            + {formatInr(material.labourRate)} labour
          </span>
        </span>
      </button>

      {isSelected && (
        <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded bg-brand-700 text-white">
          <Icon name="check" className="h-3 w-3" label="Applied" />
        </span>
      )}

      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${material.name}`}
        onClick={() => setIsExpanded((current) => !current)}
        className={cn(
          'absolute bottom-2 right-1.5 flex h-7 w-7 items-center justify-center rounded-md transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          isExpanded
            ? 'bg-stone-900 text-white'
            : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'
        )}
      >
        <Icon name="info" />
      </button>

      {isExpanded && (
        <div
          id={detailsId}
          className="space-y-1.5 border-t border-stone-200 bg-stone-50 p-2.5 text-xs leading-relaxed text-stone-600"
        >
          {material.description && <p>{material.description}</p>}
          <dl className="space-y-1.5">
            <div>
              <dt className="font-medium text-stone-800">Durability</dt>
              <dd>{material.durability}</dd>
            </div>
            <div>
              <dt className="font-medium text-stone-800">Maintenance</dt>
              <dd>{material.maintenance}</dd>
            </div>
            <div>
              <dt className="font-medium text-stone-800">Typical wastage</dt>
              <dd>{material.wastagePct}%</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
