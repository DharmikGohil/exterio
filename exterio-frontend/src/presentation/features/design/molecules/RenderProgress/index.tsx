import { Icon } from '@/presentation/shared/atoms/Icon';
import { useElapsedSeconds } from '@/presentation/shared/hooks/useElapsedSeconds';
import { renderStageAt } from '@/presentation/features/design/utils/renderStages';

export interface RenderProgressProps {
  isActive: boolean;
}

/**
 * Covers the photo while a photoreal render runs, in the loading language of the skeletons: the
 * picture softens, a sheen sweeps across it and a green glow lines its edge, and a pill at the
 * top says what is happening and for how long. The render button stays usable-looking below it.
 */
export function RenderProgress({ isActive }: RenderProgressProps) {
  const seconds = useElapsedSeconds(isActive);
  if (!isActive) {
    return null;
  }
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-2xl">
      <div aria-hidden className="absolute inset-0 bg-white/30" />
      <div
        aria-hidden
        className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/55 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgb(95_191_147/0.45)]"
      />
      <div
        role="status"
        aria-live="polite"
        className="absolute left-1/2 top-4 flex max-w-[calc(100%-6rem)] -translate-x-1/2 animate-fade-in items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-sm shadow-[0_4px_18px_rgb(0_0_0/0.22)]"
      >
        <Icon name="spinner" className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
        <span className="truncate font-semibold text-stone-900">{renderStageAt(seconds)}</span>
        <span className="shrink-0 text-[13px] tabular-nums text-stone-500">{seconds} s</span>
      </div>
    </div>
  );
}
