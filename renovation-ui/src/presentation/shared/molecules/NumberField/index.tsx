import { useId } from 'react';

import { Input } from '@/presentation/shared/atoms/Input';
import { FormField } from '@/presentation/shared/molecules/FormField';

export interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  /** Unit shown inside the field, e.g. "ft". */
  suffix?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  min = 0,
  max,
  step = 0.1,
  placeholder,
  disabled,
  className,
}: NumberFieldProps) {
  const id = useId();
  return (
    <FormField label={label} htmlFor={id} hint={hint} className={className}>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          value={value ?? ''}
          onChange={(event) => {
            const next = event.target.valueAsNumber;
            onChange(Number.isFinite(next) ? next : null);
          }}
          className={suffix ? 'pr-12' : undefined}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">
            {suffix}
          </span>
        )}
      </div>
    </FormField>
  );
}
