import type { ReactNode } from 'react';

import { Icon, type IconName } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';

const TONES = {
  info: { container: 'border-stone-200 bg-white text-stone-700', icon: 'info' },
  success: { container: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: 'success' },
  warning: { container: 'border-amber-200 bg-amber-50 text-amber-900', icon: 'warning' },
  error: { container: 'border-red-200 bg-red-50 text-red-900', icon: 'error' },
} as const satisfies Record<string, { container: string; icon: IconName }>;

export type AlertTone = keyof typeof TONES;

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  /** Buttons or links shown on the right (below the text on small screens). */
  action?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const { container, icon } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', container, className)}
    >
      <Icon name={icon} className="mt-0.5 h-4 w-4" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          {title && <p className="font-medium">{title}</p>}
          {children && <div className="leading-relaxed opacity-90">{children}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
