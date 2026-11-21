import { Icon } from '@/presentation/shared/atoms/Icon';
import { Spinner } from '@/presentation/shared/atoms/Spinner';
import { cn } from '@/presentation/shared/utils/cn';

export interface PhotoCheckingPreviewProps {
  /** Local preview of the photo being checked. */
  imageUrl: string;
  stages: readonly string[];
  activeIndex: number;
}

/** The chosen photo under a loading sheen, with a live checklist, while the server checks it. */
export function PhotoCheckingPreview({ imageUrl, stages, activeIndex }: PhotoCheckingPreviewProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-950"
      role="status"
      aria-live="polite"
      aria-label={`Checking your photo: ${stages[activeIndex]}`}
    >
      <img
        src={imageUrl}
        alt="The photo being checked"
        className="max-h-[72vh] w-full object-contain opacity-70"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div className="absolute inset-x-3 bottom-3 rounded-lg border border-stone-200 bg-white p-3 shadow-raised sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-80">
        <ol className="space-y-1.5">
          {stages.map((stage, index) => {
            const isDone = index < activeIndex;
            const isActive = index === activeIndex;
            return (
              <li
                key={stage}
                className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
                  isDone && 'text-stone-500',
                  isActive && 'font-medium text-stone-900',
                  !isDone && !isActive && 'text-stone-400'
                )}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {isDone && <Icon name="check" className="h-4 w-4 text-stone-500" />}
                  {isActive && <Spinner size="sm" />}
                  {!isDone && !isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                  )}
                </span>
                {stage}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
