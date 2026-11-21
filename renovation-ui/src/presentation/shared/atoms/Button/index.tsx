import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { Icon, type IconName } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';

const VARIANT_CLASSES = {
  /** The accent. One per screen: the action that moves the user forward. */
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900',
  /** Primary text as a fill, for strong actions that are not the main one. */
  secondary: 'bg-stone-900 text-white hover:bg-stone-800 active:bg-stone-950',
  outline:
    'border border-stone-300 bg-white text-stone-900 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100',
  ghost: 'text-stone-700 hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  link: 'text-brand-700 underline-offset-4 hover:underline',
} as const;

const SIZE_CLASSES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-9 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-11 gap-2 rounded-lg px-5 text-[15px]',
  icon: 'h-8 w-8 rounded-lg',
  inline: 'h-auto gap-1 rounded p-0 text-sm',
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASSES;
export type ButtonSize = keyof typeof SIZE_CLASSES;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  isLoading?: boolean;
  /** Icon shown before the label. */
  icon?: IconName;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      fullWidth = false,
      type = 'button',
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium',
        'transition-[color,background-color,border-color,transform] active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {isLoading ? <Icon name="spinner" className="animate-spin" /> : icon && <Icon name={icon} />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
