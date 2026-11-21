import type { ReactNode } from 'react';

import { Card } from '@/presentation/shared/atoms/Card';
import { cn } from '@/presentation/shared/utils/cn';

export interface SectionCardProps {
  title: string;
  description?: string;
  /** Shown on the right of the title, e.g. a "Saving…" indicator. */
  aside?: ReactNode;
  /** Remove the body padding, for edge-to-edge tables. */
  flush?: boolean;
  children: ReactNode;
  className?: string;
}

/** A titled card used for every section of the estimate. */
export function SectionCard({
  title,
  description,
  aside,
  flush = false,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 px-6 pb-4 pt-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-stone-900">{title}</h3>
          {description && (
            <p className="max-w-3xl text-sm leading-relaxed text-stone-600">{description}</p>
          )}
        </div>
        {aside}
      </div>
      <div className={cn(!flush && 'px-6 pb-6')}>{children}</div>
    </Card>
  );
}
