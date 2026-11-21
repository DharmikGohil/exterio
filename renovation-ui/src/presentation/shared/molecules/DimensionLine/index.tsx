import type { ReactNode } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

export interface DimensionLineProps {
  /** The measurement written on the line, e.g. `30 ft` or a cost range. */
  children: ReactNode;
  /** Optional values at each end, like the low and high of a range. */
  start?: ReactNode;
  end?: ReactNode;
  /** `mat` for use on the cutting-mat surface, in its cream tints. */
  tone?: 'light' | 'mat';
  className?: string;
}

const TONES = {
  light: { line: 'text-stone-500', figure: 'text-stone-700' },
  mat: { line: 'text-mat-line/70', figure: 'text-mat-ink' },
} as const;

/**
 * The product's signature: a measurement drawn the way an architect writes it on an
 * elevation, a thin line between two end ticks with the figure set into the middle.
 * Used wherever the interface states a measured or estimated quantity.
 */
export function DimensionLine({
  children,
  start,
  end,
  tone = 'light',
  className,
}: DimensionLineProps) {
  const colours = TONES[tone];
  return (
    <div className={cn('flex items-center gap-2 font-mono text-xs', colours.line, className)}>
      {start !== undefined && <span className="shrink-0">{start}</span>}
      <span aria-hidden className="relative h-3 min-w-6 flex-1">
        <span className="absolute inset-y-0 left-0 w-px bg-current" />
        <span className="absolute inset-x-0 top-1/2 h-px bg-current opacity-60" />
        <span className="absolute inset-y-0 right-0 w-px bg-current" />
      </span>
      <span className={cn('shrink-0', colours.figure)}>{children}</span>
      <span aria-hidden className="relative h-3 min-w-6 flex-1">
        <span className="absolute inset-y-0 left-0 w-px bg-current" />
        <span className="absolute inset-x-0 top-1/2 h-px bg-current opacity-60" />
        <span className="absolute inset-y-0 right-0 w-px bg-current" />
      </span>
      {end !== undefined && <span className="shrink-0">{end}</span>}
    </div>
  );
}
