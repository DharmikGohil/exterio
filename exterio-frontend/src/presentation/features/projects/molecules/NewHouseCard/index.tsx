import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';

export interface NewHouseCardProps {
  onCreate: () => void;
  onCreateSample: () => void;
  isCreatingSample: boolean;
}

/** The first card of the grid: start a house from a photo, or open a ready-made sample. */
export function NewHouseCard({ onCreate, onCreateSample, isCreatingSample }: NewHouseCardProps) {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-8 text-center transition-colors hover:border-stone-400">
      <button
        type="button"
        onClick={onCreate}
        className="group flex flex-col items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors group-hover:border-stone-400 group-hover:text-stone-900">
          <Icon name="plus" className="h-5 w-5" />
        </span>
        <span className="text-base font-medium text-stone-900">Start a new house</span>
      </button>
      <p className="max-w-[16rem] text-sm leading-relaxed text-stone-600">
        Upload a photo, or{' '}
        <Button variant="link" size="inline" isLoading={isCreatingSample} onClick={onCreateSample}>
          try a ready-made sample house
        </Button>
        .
      </p>
    </div>
  );
}
