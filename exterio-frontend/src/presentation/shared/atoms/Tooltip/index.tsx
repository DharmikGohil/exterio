import type { ReactNode } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

export interface TooltipProps {
  /** Short text shown on hover or keyboard focus. */
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

/** A CSS-only tooltip: no positioning engine, so keep the content short. */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-30 w-max max-w-[16rem] -translate-x-1/2 rounded-md bg-stone-900 px-2 py-1',
          'text-center text-xs font-normal leading-snug text-white opacity-0 shadow-raised transition-opacity',
          'group-focus-within/tooltip:opacity-100 group-hover/tooltip:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        )}
      >
        {content}
      </span>
    </span>
  );
}
