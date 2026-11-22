import { cn } from '@/presentation/shared/utils/cn';
import {
  NAME_TAG_BAR_WIDTH_PX,
  NAME_TAG_PADDING_X_PX,
  type NameTagPlacement,
} from '@/presentation/shared/utils/nameTagLayout';

const FONT_SIZE_PX = 11;

export interface RegionNameTagProps {
  placement: NameTagPlacement;
  /** The region type's colour, shown as a small bar on the tag's left edge. */
  color: string;
  unitsPerPixel: number;
  emphasised?: boolean;
  className?: string;
}

/** A small name tag on the photo, so each shape can be matched to its name in the list. */
export function RegionNameTag({
  placement,
  color,
  unitsPerPixel,
  emphasised = false,
  className,
}: RegionNameTagProps) {
  const unit = unitsPerPixel;
  const { x, y, width, height, name } = placement;
  return (
    <g className={cn('pointer-events-none', className)} aria-hidden>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4 * unit}
        className={emphasised ? 'fill-ink' : 'fill-white'}
        fillOpacity={emphasised ? 1 : 0.94}
      />
      <rect x={x} y={y} width={NAME_TAG_BAR_WIDTH_PX * unit} height={height} fill={color} />
      <text
        x={x + (NAME_TAG_BAR_WIDTH_PX + NAME_TAG_PADDING_X_PX) * unit}
        y={y + height / 2}
        dominantBaseline="central"
        fontSize={FONT_SIZE_PX * unit}
        className={emphasised ? 'fill-white' : 'fill-ink'}
      >
        {name}
      </text>
    </g>
  );
}
