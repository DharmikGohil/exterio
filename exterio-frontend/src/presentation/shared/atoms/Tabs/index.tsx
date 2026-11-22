import { Icon, type IconName } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  disabled?: boolean;
  /** Explains why the tab is disabled (shown as a native tooltip). */
  disabledReason?: string;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** `underline` for page sections, `pill` for a compact segmented control. */
  variant?: 'underline' | 'pill';
  /** Accessible name of the tab list. */
  label: string;
  fullWidth?: boolean;
  className?: string;
  /**
   * Classes for each tab's text, e.g. `sr-only min-[1400px]:not-sr-only` to show only the icons
   * where space is short. The text stays the tab's accessible name and its hover title.
   */
  labelClassName?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  variant = 'underline',
  label,
  fullWidth = false,
  className,
  labelClassName,
}: TabsProps<T>) {
  const isPill = variant === 'pill';
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'flex',
        isPill ? 'gap-0.5 rounded-lg bg-stone-100 p-0.5' : 'gap-6 border-b border-stone-200',
        fullWidth ? 'w-full' : 'w-fit max-w-full',
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            title={item.disabled ? item.disabledReason : labelClassName ? item.label : undefined}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              fullWidth && 'flex-1',
              isPill
                ? cn(
                    'h-7 rounded-md px-3',
                    isActive
                      ? 'bg-white text-stone-900 shadow-card ring-1 ring-stone-200'
                      : 'text-stone-600 hover:text-stone-900'
                  )
                : cn(
                    '-mb-px border-b-2 pb-2.5 pt-1',
                    isActive
                      ? 'border-stone-900 text-stone-900'
                      : 'border-transparent text-stone-500 hover:text-stone-900'
                  )
            )}
          >
            {item.icon && <Icon name={item.icon} />}
            {labelClassName ? <span className={labelClassName}>{item.label}</span> : item.label}
          </button>
        );
      })}
    </div>
  );
}
