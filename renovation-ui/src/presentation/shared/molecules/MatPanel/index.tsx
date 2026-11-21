import type { HTMLAttributes } from 'react';

import { MatAngleGuides } from '@/presentation/shared/atoms/MatAngleGuides';
import { cn } from '@/presentation/shared/utils/cn';

export type MatPanelProps = HTMLAttributes<HTMLElement>;

/**
 * A piece of green cutting mat as a panel: mat green, ruled in a fine grid with a heavier line
 * every fifth, and the angle guides in one corner. Reserved for the product's moments (the
 * estimate total, the sign-in story), so it reads as where the house is measured, not as
 * wallpaper. Text on it uses the `text-mat-line` cream.
 */
export function MatPanel({ className, children, ...rest }: MatPanelProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden rounded-xl bg-mat bg-cutting-mat bg-mat-grid text-mat-line',
        className
      )}
      {...rest}
    >
      <MatAngleGuides className="-z-10" />
      {children}
    </section>
  );
}
