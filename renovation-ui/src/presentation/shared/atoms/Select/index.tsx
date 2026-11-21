import { forwardRef, type SelectHTMLAttributes } from 'react';

import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: readonly SelectOption[];
  selectSize?: 'sm' | 'md';
  /** Classes for the wrapper (width, margins). */
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, selectSize = 'md', className, wrapperClassName, ...rest }, ref) => (
    <span className={cn('relative block', wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          'block w-full appearance-none rounded-lg border border-stone-300 bg-white pr-8 text-stone-900',
          'transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40',
          'disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500',
          selectSize === 'sm' ? 'h-8 pl-2 text-sm' : 'h-10 pl-3 text-sm',
          className
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500"
      />
    </span>
  )
);

Select.displayName = 'Select';
