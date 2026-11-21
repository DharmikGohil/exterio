import { cn } from '@/presentation/shared/utils/cn';

const GUIDE_ANGLES = [30, 45, 60] as const;

export interface MatAngleGuidesProps {
  className?: string;
}

/**
 * The 30°, 45° and 60° cutting guides a real mat prints from one corner, fanning out from the
 * bottom right of whatever box holds them. Drawn in the current text colour, very faint.
 */
export function MatAngleGuides({ className }: MatAngleGuidesProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMaxYMax slice"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    >
      {GUIDE_ANGLES.map((angle) => {
        const radians = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1={1000}
            y1={1000}
            x2={1000 - Math.cos(radians) * 2000}
            y2={1000 - Math.sin(radians) * 2000}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeDasharray={angle === 45 ? undefined : '6 6'}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
