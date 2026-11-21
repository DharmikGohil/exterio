import type { HTMLAttributes } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

const TONE_CLASSES = {
  neutral: 'bg-stone-100 text-stone-700',
  brand: 'bg-brand-50 text-brand-800',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-900',
  danger: 'bg-red-50 text-red-800',
  info: 'bg-stone-100 text-stone-700',
} as const;

export type BadgeTone = keyof typeof TONE_CLASSES;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 whitespace-nowrap rounded px-1.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className
      )}
      {...rest}
    />
  );
}
