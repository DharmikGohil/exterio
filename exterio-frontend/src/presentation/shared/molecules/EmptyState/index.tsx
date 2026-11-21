import type { ReactNode } from 'react';

import { Icon, type IconName } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  /** Buttons shown under the text. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border border-stone-200 bg-white px-6 py-12 text-center',
        className
      )}
    >
      <Icon name={icon} className="h-5 w-5 text-stone-400" />
      <h3 className="mt-3 text-base font-medium text-stone-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm leading-relaxed text-stone-600">{description}</p>
      )}
      {action && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>
      )}
    </div>
  );
}
