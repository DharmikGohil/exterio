import { Icon } from '@/presentation/shared/atoms/Icon';
import { Tooltip } from '@/presentation/shared/atoms/Tooltip';
import { cn } from '@/presentation/shared/utils/cn';

export interface NameTagToggleProps {
  isOn: boolean;
  onToggle: () => void;
  /** Inactive where names cannot be drawn (the before / after slider). */
  disabled?: boolean;
  className?: string;
}

/** The eye button floating on a photo: shows or hides the name tag on each region. */
export function NameTagToggle({ isOn, onToggle, disabled = false, className }: NameTagToggleProps) {
  const label = isOn ? 'Hide names' : 'Show names';
  return (
    <Tooltip content={label} side="bottom" align="end" className={className}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={isOn}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-raised transition-colors',
          'hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <Icon name={isOn ? 'eye' : 'eye-off'} className="h-5 w-5" />
      </button>
    </Tooltip>
  );
}
