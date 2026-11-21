import type { ReactNode } from 'react';

import { Spinner } from '@/presentation/shared/atoms/Spinner';
import { cn } from '@/presentation/shared/utils/cn';

export interface ShimmerOverlayProps {
  /** Short status shown in a note at the top left, like "Finding walls and windows". */
  status: ReactNode;
  className?: string;
}

/**
 * Covers an image that the server is working on: the picture dims and a sheen sweeps across
 * it, the same loading language as the skeletons, with a status note saying what is happening.
 */
export function ShimmerOverlay({ status, className }: ShimmerOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden rounded-xl', className)}
    >
      <div className="absolute inset-0 bg-white/45" />
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="absolute left-3 top-3 flex h-8 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-900 shadow-raised">
        <Spinner size="sm" className="text-stone-500" />
        {status}
      </div>
    </div>
  );
}
