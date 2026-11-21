import { cn } from '@/presentation/shared/utils/cn';
import { initials } from '@/presentation/shared/utils/format';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** A person's initials in a round brand-tinted badge. Decorative: the name is said elsewhere. */
export function Avatar({ name, size = 'sm', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-medium text-brand-800',
        size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm',
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
