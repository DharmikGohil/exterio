import { Input } from '@/presentation/shared/atoms/Input';
import { useInlineNumberInput } from '@/presentation/shared/hooks/useInlineNumberInput';
import { cn } from '@/presentation/shared/utils/cn';

export interface InlineNumberCellProps {
  /** The saved value. */
  value: number;
  /** Changes whenever fresh server data arrives (e.g. the query's `dataUpdatedAt`). */
  syncToken: number | string;
  /** Called after a short typing pause, on Enter and on blur, when the number changed. */
  onCommit: (value: number) => void;
  /** Accessible name, e.g. "Material rate for Texture paint". */
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** Marks a value the user has overridden. */
  highlighted?: boolean;
  disabled?: boolean;
  className?: string;
}

/** A compact, self-saving number field for use inside tables. */
export function InlineNumberCell({
  value,
  syncToken,
  onCommit,
  label,
  min = 0,
  max,
  step,
  highlighted = false,
  disabled = false,
  className,
}: InlineNumberCellProps) {
  const { inputProps, isInvalid } = useInlineNumberInput({ value, syncToken, onCommit, min, max });

  return (
    <Input
      type="number"
      inputMode="decimal"
      inputSize="sm"
      aria-label={label}
      min={min}
      max={max}
      step={step ?? 'any'}
      disabled={disabled}
      invalid={isInvalid}
      className={cn(
        'w-24 text-right tabular-nums',
        highlighted && 'border-brand-400 bg-brand-50 font-medium text-brand-900',
        className
      )}
      {...inputProps}
    />
  );
}
