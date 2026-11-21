import { Button } from '@/presentation/shared/atoms/Button';

export interface FloatingSaveBarProps {
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  /** Names what will be saved, e.g. "Save regions". */
  saveLabel: string;
}

/**
 * The "Unsaved changes · Discard · Save" bar that floats at the bottom centre of a photo while
 * there are edits to keep. Show it only when something has changed.
 */
export function FloatingSaveBar({ onSave, onDiscard, isSaving, saveLabel }: FloatingSaveBarProps) {
  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      className="flex animate-slide-up items-center gap-2 rounded-2xl border border-stone-200 bg-white p-2 pl-4 shadow-raised"
    >
      <p className="mr-1 flex items-center gap-2 whitespace-nowrap text-[15px] text-stone-800">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-stone-900" />
        Unsaved changes
      </p>
      <Button variant="outline" size="lg" disabled={isSaving} onClick={onDiscard}>
        Discard
      </Button>
      <Button size="lg" isLoading={isSaving} onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  );
}
