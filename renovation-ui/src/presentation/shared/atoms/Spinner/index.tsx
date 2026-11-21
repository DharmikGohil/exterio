import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
} as const;

export interface SpinnerProps {
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  /** Announced to screen readers. */
  label?: string;
}

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex">
      <Icon name="spinner" className={cn('animate-spin', SIZE_CLASSES[size], className)} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
