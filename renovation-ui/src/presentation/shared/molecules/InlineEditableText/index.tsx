import { useState, type KeyboardEvent } from 'react';

import { Icon } from '@/presentation/shared/atoms/Icon';
import { Input } from '@/presentation/shared/atoms/Input';
import { cn } from '@/presentation/shared/utils/cn';

export interface InlineEditableTextProps {
  value: string;
  /** Called with the trimmed text when it changed and is not empty. */
  onSave: (value: string) => void;
  /** Accessible name, e.g. "Project name". */
  label: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

/** Text that turns into a field when clicked. Enter or blur saves, Escape cancels. */
export function InlineEditableText({
  value,
  onSave,
  label,
  maxLength = 80,
  disabled = false,
  className,
}: InlineEditableTextProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const isEditing = draft !== null;

  const commit = () => {
    const next = draft?.trim();
    if (next && next !== value) {
      onSave(next);
    }
    setDraft(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commit();
    } else if (event.key === 'Escape') {
      setDraft(null);
    }
  };

  if (isEditing) {
    return (
      <Input
        autoFocus
        aria-label={label}
        inputSize="sm"
        maxLength={maxLength}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onFocus={(event) => event.target.select()}
        className={cn('max-w-xs font-medium', className)}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      title={`Rename: ${value}`}
      aria-label={`${label}: ${value}. Click to rename.`}
      onClick={() => setDraft(value)}
      className={cn(
        'group/edit inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left font-medium text-stone-900',
        'transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        'disabled:cursor-default disabled:hover:bg-transparent',
        className
      )}
    >
      <span className="truncate">{value}</span>
      <Icon
        name="edit"
        className="h-3.5 w-3.5 text-stone-400 transition-colors group-hover/edit:text-stone-600"
      />
    </button>
  );
}
