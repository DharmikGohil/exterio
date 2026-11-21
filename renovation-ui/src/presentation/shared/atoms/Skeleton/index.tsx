import { cn } from '@/presentation/shared/utils/cn';

export interface SkeletonProps {
  className?: string;
}

/**
 * A placeholder with the shape of content that is loading. A soft sheen sweeps across it
 * from left to right, the usual loading pattern, so it reads as "on its way" rather than
 * empty. Size and shape come from Tailwind classes.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('relative overflow-hidden rounded-md bg-stone-200/80', className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}
