import { forwardRef, useState } from 'react';

import { Icon } from '@/presentation/shared/atoms/Icon';
import { Input, type InputProps } from '@/presentation/shared/atoms/Input';
import { cn } from '@/presentation/shared/utils/cn';

export type PasswordInputProps = Omit<InputProps, 'type'>;

/** A password field with an eye button that shows or hides what was typed. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...rest }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Icon name={isVisible ? 'eye-off' : 'eye'} />
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
