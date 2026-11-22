import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';
import {
  DETECTION_STAGES,
  TYPICAL_DETECTION_SECONDS,
  useDetectionProgress,
} from '@/presentation/features/studio/hooks/useDetectionProgress';

export interface DetectionProgressProps {
  isActive: boolean;
}

/**
 * Covers the photo while Auto-detect runs: a scanning line sweeps over the house, and a card
 * shows the time so far, a bar, and what the AI is looking for, step by step.
 */
export function DetectionProgress({ isActive }: DetectionProgressProps) {
  const { seconds, stageIndex, progress, isSlow } = useDetectionProgress(isActive);
  if (!isActive) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Auto-detect is finding the parts of the house"
      className="absolute inset-0 z-20 overflow-hidden rounded-2xl"
    >
      <div className="absolute inset-0 bg-white/40" />
      <div aria-hidden className="absolute inset-x-0 animate-scan">
        <div className="h-24 bg-gradient-to-b from-transparent via-brand-300/30 to-brand-400/40" />
        <div className="h-0.5 bg-brand-500/80 shadow-[0_0_12px_2px_rgb(54_120_98/0.6)]" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[22rem] rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-raised">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[15px] font-medium text-stone-900">
              Finding the parts of your house
            </p>
            <p className="shrink-0 text-xs tabular-nums text-stone-500">{seconds} s</p>
          </div>
          <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <ol className="mt-3 space-y-1.5">
            {DETECTION_STAGES.map((stage, index) => {
              const isDone = index < stageIndex;
              const isCurrent = index === stageIndex;
              return (
                <li
                  key={stage.label}
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    isDone && 'text-stone-500',
                    isCurrent && 'font-medium text-stone-900',
                    !isDone && !isCurrent && 'text-stone-400'
                  )}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isDone && <Icon name="check" className="h-3.5 w-3.5 text-brand-600" />}
                    {isCurrent && (
                      <Icon name="spinner" className="h-3.5 w-3.5 animate-spin text-brand-600" />
                    )}
                    {!isDone && !isCurrent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    )}
                  </span>
                  {stage.label}
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-stone-500">
            {isSlow
              ? 'Taking longer than usual. The AI is still working; please keep this page open.'
              : `Usually about ${TYPICAL_DETECTION_SECONDS - 5} to ${TYPICAL_DETECTION_SECONDS + 5} seconds. You can review and fix every part afterwards.`}
          </p>
        </div>
      </div>
    </div>
  );
}
