import { cn } from '@/presentation/shared/utils/cn';
import { config } from '@/config';

export interface LogoProps {
  className?: string;
}

/**
 * The wordmark with its mark: a house front drawn as an elevation line, with a
 * dimension tick under it. Flat, one colour, inherits the text colour.
 */
export function Logo({ className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-stone-900', className)}>
      <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5" fill="none">
        <path
          d="M3.5 15V8.5L10 3.5l6.5 5V15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M8.25 15v-3.5h3.5V15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M3.5 17.75h13M3.5 16.75v2M16.5 16.75v2" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span className="text-[18px] font-medium leading-none">{config.appName}</span>
    </span>
  );
}
