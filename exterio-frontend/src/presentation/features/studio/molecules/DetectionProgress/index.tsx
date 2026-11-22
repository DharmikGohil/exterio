import { Icon } from '@/presentation/shared/atoms/Icon';
import {
  DETECTION_STAGES,
  useDetectionProgress,
} from '@/presentation/features/studio/hooks/useDetectionProgress';
import { revealPhrase } from '@/presentation/features/studio/utils/detectionReveal';
import type { RegionLabel } from '@/domain/models/project';

export interface DetectionRevealStatus {
  isActive: boolean;
  isDone: boolean;
  shown: number;
  total: number;
  /** The kind of the part drawn most recently. */
  latestLabel: RegionLabel | null;
}

export interface DetectionProgressProps {
  isDetecting: boolean;
  reveal: DetectionRevealStatus;
}

/**
 * Auto-detect on the photo. While the AI works, a soft green glow and a sweep pass over the
 * house and a pill at the bottom says what it looks for and for how long. When the answer
 * arrives the parts are drawn one after another (by the canvas) and the pill counts them, then
 * says "All done". The pill sits at the bottom edge so the house stays visible.
 */
export function DetectionProgress({ isDetecting, reveal }: DetectionProgressProps) {
  const { seconds, stageIndex, isSlow } = useDetectionProgress(isDetecting);
  if (!isDetecting && !reveal.isActive) {
    return null;
  }

  let title: string;
  let detail: string;
  if (isDetecting) {
    title = isSlow ? 'Taking longer than usual…' : DETECTION_STAGES[stageIndex].label;
    detail = `${seconds} s`;
  } else if (reveal.isDone) {
    title = `All done: ${reveal.total} part${reveal.total === 1 ? '' : 's'} found`;
    detail = 'Review them and fix anything wrong';
  } else {
    title = `Found ${reveal.shown} part${reveal.shown === 1 ? '' : 's'}`;
    detail = reveal.latestLabel ? revealPhrase(reveal.latestLabel) : '';
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl">
      {isDetecting && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgb(95_191_147/0.45)]"
          />
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-1/2 animate-sweep bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </>
      )}
      <div
        role="status"
        aria-live="polite"
        className="absolute bottom-4 left-1/2 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 animate-fade-in items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-sm shadow-[0_4px_18px_rgb(0_0_0/0.22)]"
      >
        {reveal.isDone && !isDetecting ? (
          <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
            <Icon name="check" className="h-3 w-3" />
          </span>
        ) : (
          <Icon name="spinner" className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
        )}
        <span className="whitespace-nowrap font-semibold text-stone-900">{title}</span>
        {detail && (
          <span className="truncate text-[13px] tabular-nums text-stone-500">{detail}</span>
        )}
      </div>
    </div>
  );
}
