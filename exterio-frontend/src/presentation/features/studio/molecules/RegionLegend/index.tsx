import { ColorDot } from '@/presentation/shared/atoms/ColorDot';
import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';
import type { RegionLabel } from '@/domain/models/project';

export interface RegionLegendProps {
  /** Only these labels are listed. */
  labels: readonly RegionLabel[];
}

export function RegionLegend({ labels }: RegionLegendProps) {
  if (labels.length === 0) {
    return null;
  }
  return (
    <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600">
      {labels.map((label) => (
        <li key={label} className="flex items-center gap-1.5">
          <ColorDot color={REGION_LABEL_META[label].color} />
          {REGION_LABEL_META[label].label}
        </li>
      ))}
    </ul>
  );
}
