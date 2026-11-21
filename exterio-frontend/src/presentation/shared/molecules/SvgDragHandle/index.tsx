import { useRef, type MouseEvent, type PointerEvent } from 'react';

import type { Point } from '@/domain/models/project';
import { cn } from '@/presentation/shared/utils/cn';

const TONE_CLASSES = {
  default: 'fill-white stroke-ink',
  selected: 'fill-brand-500 stroke-ink',
  accent: 'fill-sky-500 stroke-white',
} as const;

/** Visible radius and touch-friendly hit radius, in CSS pixels. */
const VISIBLE_RADIUS_PX = 6.5;
const HIT_RADIUS_PX = 16;

export interface SvgDragHandleProps {
  point: Point;
  /** Image pixels per CSS pixel (from `useSvgCanvas`), keeps the handle a constant size. */
  unitsPerPixel: number;
  /** Converts pointer coordinates to image coordinates (from `useSvgCanvas`). */
  toImagePoint: (clientX: number, clientY: number) => Point | null;
  onDrag: (point: Point) => void;
  /** Fired on press, before any movement (use it to select the handle). */
  onPress?: () => void;
  /** Fired on right-click. */
  onRemove?: () => void;
  /** Accessible name, also shown as a native tooltip. */
  label: string;
  /** Short caption drawn next to the handle, e.g. "TL". */
  caption?: string;
  tone?: keyof typeof TONE_CLASSES;
}

/** A draggable point on an SVG canvas. Works with mouse, pen and touch (pointer capture). */
export function SvgDragHandle({
  point,
  unitsPerPixel,
  toImagePoint,
  onDrag,
  onPress,
  onRemove,
  label,
  caption,
  tone = 'default',
}: SvgDragHandleProps) {
  const isDraggingRef = useRef(false);
  const [x, y] = point;

  const handlePointerDown = (event: PointerEvent<SVGCircleElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    onPress?.();
  };

  const handlePointerMove = (event: PointerEvent<SVGCircleElement>) => {
    if (!isDraggingRef.current) {
      return;
    }
    const next = toImagePoint(event.clientX, event.clientY);
    if (next) {
      onDrag(next);
    }
  };

  const handlePointerEnd = (event: PointerEvent<SVGCircleElement>) => {
    isDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleContextMenu = (event: MouseEvent<SVGCircleElement>) => {
    if (onRemove) {
      event.preventDefault();
      event.stopPropagation();
      onRemove();
    }
  };

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={VISIBLE_RADIUS_PX * unitsPerPixel}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        className={cn('pointer-events-none drop-shadow', TONE_CLASSES[tone])}
      />
      {caption && (
        <text
          x={x + 11 * unitsPerPixel}
          y={y - 9 * unitsPerPixel}
          fontSize={12 * unitsPerPixel}
          strokeWidth={3 * unitsPerPixel}
          className="pointer-events-none select-none fill-white stroke-ink font-medium [paint-order:stroke]"
        >
          {caption}
        </text>
      )}
      <circle
        cx={x}
        cy={y}
        r={HIT_RADIUS_PX * unitsPerPixel}
        role="button"
        aria-label={label}
        className="cursor-grab touch-none fill-transparent active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={handleContextMenu}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <title>{label}</title>
      </circle>
    </g>
  );
}
