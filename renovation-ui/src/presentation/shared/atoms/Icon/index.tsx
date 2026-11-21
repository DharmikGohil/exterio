import { cn } from '@/presentation/shared/utils/cn';

import { ICONS, type IconName } from './icons';

export type { IconName } from './icons';

export interface IconProps {
  name: IconName;
  /** Size and colour come from Tailwind classes, e.g. `h-4 w-4 text-stone-500`. */
  className?: string;
  /** Accessible label. Omit for decorative icons. */
  label?: string;
}

export function Icon({ name, className, label }: IconProps) {
  const LucideIcon = ICONS[name];
  return (
    <LucideIcon
      className={cn('h-4 w-4 shrink-0', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      strokeWidth={1.5}
    />
  );
}
