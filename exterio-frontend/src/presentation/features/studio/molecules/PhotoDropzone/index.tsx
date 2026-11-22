import { useState, type DragEvent } from 'react';

import { Icon } from '@/presentation/shared/atoms/Icon';
import { Spinner } from '@/presentation/shared/atoms/Spinner';
import { cn } from '@/presentation/shared/utils/cn';

export interface PhotoDropzoneProps {
  onFileSelected: (file: File) => void;
  /** Opens the file browser. */
  onBrowse: () => void;
  isUploading: boolean;
  /** Marks the drop zone for the guided tour. */
  tourTarget?: string;
}

export function PhotoDropzone({
  onFileSelected,
  onBrowse,
  isUploading,
  tourTarget,
}: PhotoDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files[0];
    if (file && !isUploading) {
      onFileSelected(file);
    }
  };

  return (
    <button
      type="button"
      data-tour={tourTarget}
      disabled={isUploading}
      onClick={onBrowse}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        isDraggingOver
          ? 'border-stone-900 bg-stone-100'
          : 'border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50',
        isUploading && 'cursor-wait'
      )}
    >
      {isUploading ? (
        <Spinner size="lg" label="Uploading" className="text-stone-500" />
      ) : (
        <Icon name="upload" className="h-5 w-5 text-stone-500" />
      )}
      {isUploading ? (
        <span className="space-y-1">
          <span className="block text-[15px] font-medium text-stone-900">
            Uploading and checking your photo…
          </span>
          <span className="block text-sm text-stone-500">This usually takes a few seconds.</span>
        </span>
      ) : (
        <span className="space-y-1">
          <span className="block text-[15px] font-medium text-stone-900">
            Drop a photo of the house front, or choose one
          </span>
          <span className="block font-mono text-xs text-stone-500">
            JPG, PNG or WebP · up to 15 MB
          </span>
        </span>
      )}
    </button>
  );
}
