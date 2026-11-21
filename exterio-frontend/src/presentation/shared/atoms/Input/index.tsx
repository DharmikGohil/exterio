import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field as invalid (red border, `aria-invalid`). */
  invalid?: boolean;
  /** `sm` is used inside dense tables and side panels. */
  inputSize?: 'sm' | 'md';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, inputSize = 'md', className, type = 'text', ...rest }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full rounded-lg border bg-white text-stone-900 placeholder:text-stone-400',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        'disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500',
        inputSize === 'sm' ? 'h-8 px-2 text-sm' : 'h-10 px-3 text-sm',
        invalid ? 'border-red-400 focus:border-red-500' : 'border-stone-300 focus:border-brand-500',
        className
      )}
      {...rest}
    />
  )
);

Input.displayName = 'Input';
