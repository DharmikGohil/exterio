import type { ReactNode } from 'react';

import { Label } from '@/presentation/shared/atoms/Label';
import { cn } from '@/presentation/shared/utils/cn';

export interface FormFieldProps {
  label: string;
  /** `id` of the control rendered as children. */
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, hint, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs leading-relaxed text-stone-500">{hint}</p>
      )}
    </div>
  );
}
