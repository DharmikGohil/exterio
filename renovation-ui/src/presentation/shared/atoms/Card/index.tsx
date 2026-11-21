import type { HTMLAttributes } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...rest }: CardProps) {
  return <div className={cn('rounded-xl border border-stone-200 bg-white', className)} {...rest} />;
}

export function CardContent({ className, ...rest }: CardProps) {
  return <div className={cn('p-5', className)} {...rest} />;
}
