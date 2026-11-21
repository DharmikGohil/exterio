import type { Point } from '@/domain/models/project';

const TICK_PX = 7;
const LABEL_HEIGHT_PX = 20;
const LABEL_PADDING_X_PX = 7;
const FONT_SIZE_PX = 12;
/** IBM Plex Mono at 12px is 7.2px per character. */
const CHAR_WIDTH_PX = 7.2;

export interface SvgDimensionProps {
  start: Point;
  end: Point;
  /** The measurement, e.g. `30 ft`. */
  label: string;
  /** How far outside the measured edge the line sits, in screen pixels. */
  offsetPx: number;
  /** A point inside the shape; the line is drawn on the side away from it. */
  awayFrom: Point;
  unitsPerPixel: number;
  /** `pending` is drawn dashed and muted, for a value the user has not entered yet. */
  isPending?: boolean;
}

/**
 * A dimension line drawn the way an architect writes one on an elevation: parallel to
 * the measured edge, set off from it, with end ticks and the figure in the middle.
 */
export function SvgDimension({
  start,
  end,
  label,
  offsetPx,
  awayFrom,
  unitsPerPixel,
  isPending = false,
}: SvgDimensionProps) {
  const unit = unitsPerPixel;
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy) || 1;
  let nx = -dy / length;
  let ny = dx / length;
  const midX = (start[0] + end[0]) / 2;
  const midY = (start[1] + end[1]) / 2;
  if ((awayFrom[0] - midX) * nx + (awayFrom[1] - midY) * ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const offset = offsetPx * unit;
  const a: Point = [start[0] + nx * offset, start[1] + ny * offset];
  const b: Point = [end[0] + nx * offset, end[1] + ny * offset];
  const tick = TICK_PX * unit;
  const labelWidth = (label.length * CHAR_WIDTH_PX + LABEL_PADDING_X_PX * 2) * unit;
  const labelHeight = LABEL_HEIGHT_PX * unit;
  const centre: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const lineClass = isPending ? 'stroke-white/80' : 'stroke-white';

  return (
    <g className="pointer-events-none" aria-hidden>
      {[start, end].map((point, index) => (
        <line
          key={`ext-${index}`}
          x1={point[0] + nx * 3 * unit}
          y1={point[1] + ny * 3 * unit}
          x2={point[0] + nx * (offset + tick)}
          y2={point[1] + ny * (offset + tick)}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          className="stroke-white/70"
        />
      ))}
      <line
        x1={a[0]}
        y1={a[1]}
        x2={b[0]}
        y2={b[1]}
        strokeWidth={1.5}
        strokeDasharray={isPending ? '4 4' : undefined}
        vectorEffect="non-scaling-stroke"
        className={lineClass}
      />
      {[a, b].map((point, index) => (
        <line
          key={`tick-${index}`}
          x1={point[0] - (dx / length + nx) * tick * 0.5}
          y1={point[1] - (dy / length + ny) * tick * 0.5}
          x2={point[0] + (dx / length + nx) * tick * 0.5}
          y2={point[1] + (dy / length + ny) * tick * 0.5}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          className="stroke-white"
        />
      ))}
      <rect
        x={centre[0] - labelWidth / 2}
        y={centre[1] - labelHeight / 2}
        width={labelWidth}
        height={labelHeight}
        rx={4 * unit}
        className={isPending ? 'fill-white/90' : 'fill-ink'}
      />
      <text
        x={centre[0]}
        y={centre[1]}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={FONT_SIZE_PX * unit}
        className={isPending ? 'fill-ink/70 font-mono' : 'fill-white font-mono'}
      >
        {label}
      </text>
    </g>
  );
}
