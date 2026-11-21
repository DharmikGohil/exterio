import type { ReactNode } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

export interface TooltipProps {
  /** Short text shown on hover or keyboard focus. */
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  /** `end` lines the tooltip up with the trigger's right edge, for controls near the screen edge. */
  align?: 'center' | 'end';
  className?: string;
}

/** A CSS-only tooltip: no positioning engine, so keep the content short. */
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className,
}: TooltipProps) {
  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-30 w-max max-w-[16rem] rounded-md bg-stone-900 px-2 py-1',
          align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0',
          'text-center text-xs font-normal leading-snug text-white opacity-0 shadow-raised transition-opacity',
          // Keyboard focus only: after a mouse click the trigger keeps focus, and a tooltip that stays
          // open over the page reads as stuck.
          'group-hover/tooltip:opacity-100 group-has-[:focus-visible]/tooltip:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        )}
      >
        {content}
      </span>
    </span>
  );
}
