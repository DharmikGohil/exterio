import { Button } from '@/presentation/shared/atoms/Button';
import { Tooltip } from '@/presentation/shared/atoms/Tooltip';
import type { RenderStatus } from '@/domain/models/design';

export const RENDER_HINT =
  'Adds realistic light and texture to the finishes in about 10 to 15 seconds. The rest of the photo stays as it is.';

export interface RenderButtonProps {
  status: RenderStatus;
  isRequesting: boolean;
  onGenerate: () => void;
}

/**
 * Makes the photoreal render. It floats at the bottom centre of the photo it renders; while it
 * runs, the button spins and `RenderProgress` covers the photo; a failure shows above the photo.
 */
export function RenderButton({ status, isRequesting, onGenerate }: RenderButtonProps) {
  const isPending = status === 'pending';

  return (
    <Tooltip content={RENDER_HINT}>
      <Button
        size="lg"
        icon="image"
        className="shadow-raised"
        disabled={isPending}
        isLoading={isRequesting || isPending}
        onClick={onGenerate}
      >
        {isPending ? 'Rendering…' : status === 'done' ? 'Regenerate render' : 'Generate render'}
      </Button>
    </Tooltip>
  );
}
