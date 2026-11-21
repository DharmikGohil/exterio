import { Spinner } from '@/presentation/shared/atoms/Spinner';

export interface SavingIndicatorProps {
  isSaving: boolean;
}

/** A small "Saving…" note shown while an inline edit is on its way to the server. */
export function SavingIndicator({ isSaving }: SavingIndicatorProps) {
  if (!isSaving) {
    return null;
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
      <Spinner size="sm" label="Saving" />
      Saving…
    </span>
  );
}
