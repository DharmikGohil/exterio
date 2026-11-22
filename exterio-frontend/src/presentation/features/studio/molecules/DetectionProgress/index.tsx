import { Icon } from '@/presentation/shared/atoms/Icon';
import {
  DETECTION_STAGES,
  useDetectionProgress,
} from '@/presentation/features/studio/hooks/useDetectionProgress';
import { revealPhrase } from '@/presentation/features/studio/utils/detectionReveal';
import type { RegionLabel } from '@/domain/models/project';

export interface DetectionProgressProps {
  /** Auto-detect is running. */
  isRunning: boolean;
  /** Parts found so far; each is drawn on the photo the moment the AI has written it. */
  found: number;
  /** The kind of the part found most recently. */
  latestLabel: RegionLabel | null;
  /** Once finished, how many parts it found ("All done"), for a few seconds. */
  doneCount: number | null;
}

/**
 * Auto-detect on the photo. A soft green glow and a sheen sweep over the house while the AI
 * works, and a pill at the bottom edge says where it is: what it is looking at and for how long
 * before the first part arrives, then a live count of the parts found as they appear, then
 * "All done". The pill keeps clear of the house.
 */
export function DetectionProgress({
  isRunning,
  found,
  latestLabel,
  doneCount,
}: DetectionProgressProps) {
  const { seconds, stageIndex, isSlow } = useDetectionProgress(isRunning);
  if (!isRunning && doneCount === null) {
    return null;
  }

  let title: string;
  let detail: string;
  if (isRunning && found === 0) {
    title = isSlow ? 'Taking longer than usual…' : DETECTION_STAGES[stageIndex].label;
    detail = `${seconds} s`;
  } else if (isRunning) {
    title = `Found ${found} part${found === 1 ? '' : 's'}`;
    detail = latestLabel ? revealPhrase(latestLabel) : '';
  } else {
    title = `All done: ${doneCount} part${doneCount === 1 ? '' : 's'} found`;
    detail = 'Review them and fix anything wrong';
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl">
      {isRunning && (
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
        {isRunning ? (
          <Icon name="spinner" className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
        ) : (
          <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
            <Icon name="check" className="h-3 w-3" />
          </span>
        )}
        <span className="whitespace-nowrap font-semibold text-stone-900">{title}</span>
        {detail && (
          <span className="truncate text-[13px] tabular-nums text-stone-500">{detail}</span>
        )}
      </div>
    </div>
  );
}
