import { cn } from '@/presentation/shared/utils/cn';

export interface ColorDotProps {
  /** Any CSS colour, e.g. a hex value from the API. */
  color: string;
  className?: string;
}

/** A small filled circle in an arbitrary colour (drawn as SVG, so no inline styles). */
export function ColorDot({ color, className }: ColorDotProps) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className={cn('h-2.5 w-2.5 shrink-0', className)}>
      <circle cx="5" cy="5" r="5" fill={color} />
    </svg>
  );
}
