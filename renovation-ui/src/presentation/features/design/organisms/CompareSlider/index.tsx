import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { ImageCanvas } from '@/presentation/shared/molecules/ImageCanvas';
import { useSvgCanvas } from '@/presentation/shared/hooks/useSvgCanvas';
import { clamp } from '@/presentation/shared/utils/geometry';
import type { ProjectImage } from '@/domain/models/project';

const KEYBOARD_STEP = 0.05;

export interface CompareSliderProps {
  image: ProjectImage;
  /** The original photo (left of the divider). */
  beforeUrl: string;
  /** The redesigned picture (right of the divider). */
  afterUrl: string;
}

/**
 * Before/after comparison: two stacked pictures and a draggable divider.
 * The "before" picture is clipped to the left of the divider; both share one SVG coordinate
 * system, so the divider tracks the pointer exactly at any size.
 */
export function CompareSlider({ image, beforeUrl, afterUrl }: CompareSliderProps) {
  const clipId = useId();
  const { svgRef, unitsPerPixel, toImagePoint } = useSvgCanvas(image.width, image.height);
  const [position, setPosition] = useState(0.5);
  const isDraggingRef = useRef(false);
  const dividerX = position * image.width;

  const moveTo = (event: PointerEvent<SVGSVGElement>) => {
    const point = toImagePoint(event.clientX, event.clientY);
    if (point) {
      setPosition(clamp(point[0] / image.width, 0, 1));
    }
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    moveTo(event);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (isDraggingRef.current) {
      moveTo(event);
    }
  };

  const handlePointerEnd = () => {
    isDraggingRef.current = false;
  };

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'ArrowLeft') {
      setPosition((current) => clamp(current - KEYBOARD_STEP, 0, 1));
    } else if (event.key === 'ArrowRight') {
      setPosition((current) => clamp(current + KEYBOARD_STEP, 0, 1));
    }
  };

  return (
    <div className="relative">
      <ImageCanvas
        ref={svgRef}
        imageUrl={afterUrl}
        imageWidth={image.width}
        imageHeight={image.height}
        label="Before and after comparison. Drag the divider to compare."
        className="cursor-ew-resize touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={dividerX} height={image.height} />
          </clipPath>
        </defs>
        <image
          href={beforeUrl}
          width={image.width}
          height={image.height}
          preserveAspectRatio="none"
          clipPath={`url(#${clipId})`}
          className="pointer-events-none"
        />
        <line
          x1={dividerX}
          y1={0}
          x2={dividerX}
          y2={image.height}
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
          className="pointer-events-none stroke-white [filter:drop-shadow(0_0_2px_rgb(0_0_0/0.6))]"
        />
        <g
          role="slider"
          tabIndex={0}
          aria-label="Before and after divider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position * 100)}
          transform={`translate(${dividerX} ${image.height / 2}) scale(${unitsPerPixel})`}
          className="outline-none [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.45))] focus-visible:[&>circle]:stroke-brand-500"
          onKeyDown={handleKeyDown}
        >
          <circle r={20} strokeWidth={2} className="fill-white stroke-white" />
          <path
            d="M -5 -6 L -11 0 L -5 6 M 5 -6 L 11 0 L 5 6"
            fill="none"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-ink"
          />
        </g>
      </ImageCanvas>
      <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-ink/75 px-2 py-1 text-xs font-medium text-white">
        Before
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-ink/75 px-2 py-1 text-xs font-medium text-white">
        After
      </span>
    </div>
  );
}
