import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';
import { formatInr } from '@/presentation/shared/utils/format';
import { ScaleEditor } from '@/presentation/features/studio/organisms/ScaleEditor';
import type { Estimate } from '@/domain/models/estimate';
import type { Project, ProjectImage } from '@/domain/models/project';

export interface EstimateSizeViewProps {
  project: Project;
  image: ProjectImage;
  /** The estimate as it stands, so the total can be watched while the size changes. */
  estimate: Estimate | undefined;
  isRefreshing: boolean;
  onBack: () => void;
}

/**
 * The real-world size, opened from the estimate: the only place it is used. The size saves as
 * it is typed and the total beside the title follows it.
 */
export function EstimateSizeView({
  project,
  image,
  estimate,
  isRefreshing,
  onBack,
}: EstimateSizeViewProps) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 rounded-md text-[15px] text-stone-700 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Icon name="arrow-left" />
        Back to your estimate
      </button>

      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-[34px] font-medium leading-tight tracking-[-0.015em] text-stone-900">
            Set the real-world size
          </h1>
          <p className="max-w-3xl text-[15px] leading-relaxed text-stone-600">
            A photo only knows pixels. One real measurement turns each part into square feet, and
            square feet into a cost.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {estimate && (
            <div
              aria-live="polite"
              aria-busy={isRefreshing}
              className="rounded-2xl border border-stone-200 bg-white px-5 py-3"
            >
              <p className="text-sm text-stone-600">Estimated total</p>
              <p
                className={cn(
                  'text-xl font-medium tabular-nums text-stone-900 transition-opacity',
                  isRefreshing && 'opacity-50'
                )}
              >
                {formatInr(estimate.totals.grandTotal)}
              </p>
            </div>
          )}
          <Button size="lg" onClick={onBack}>
            Done
          </Button>
        </div>
      </div>

      <ScaleEditor project={project} image={image} />
    </div>
  );
}
