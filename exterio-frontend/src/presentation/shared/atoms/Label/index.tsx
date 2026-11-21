import type { LabelHTMLAttributes } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, children, ...rest }: LabelProps) {
  return (
    <label className={cn('block text-sm font-medium text-stone-700', className)} {...rest}>
      {children}
    </label>
  );
}
