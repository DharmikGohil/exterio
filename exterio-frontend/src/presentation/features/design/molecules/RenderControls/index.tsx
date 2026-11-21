import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import type { RenderStatus } from '@/domain/models/design';

export interface RenderControlsProps {
  status: RenderStatus;
  /** Failure message from the server when `status` is `failed`. */
  error: string | null;
  isRequesting: boolean;
  onGenerate: () => void;
}

/**
 * The "Generate photoreal render" button with its progress and failure states. Only shown when
 * the server has a renderer (see `photorealOptions`).
 */
export function RenderControls({ status, error, isRequesting, onGenerate }: RenderControlsProps) {
  const isPending = status === 'pending';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          variant="secondary"
          icon="image"
          disabled={isPending}
          isLoading={isRequesting || isPending}
          onClick={onGenerate}
        >
          {status === 'done' ? 'Regenerate photoreal render' : 'Generate photoreal render'}
        </Button>
        <p className="min-w-0 flex-1 basis-56 text-sm leading-relaxed text-stone-600">
          Adds realistic light and texture to the finishes in about 10 seconds (up to 30 the first
          time). Everything else stays exactly as in your photo.
        </p>
      </div>

      {isPending && (
        <Alert tone="info" title="Creating your photoreal render…">
          This takes about 10 seconds, or up to 30 if the renderer was idle. You can keep working;
          it appears here when ready.
        </Alert>
      )}
      {status === 'failed' && (
        <Alert tone="error" title="The photoreal render failed">
          {error ?? 'Something went wrong while rendering. Please try again.'}
        </Alert>
      )}
    </div>
  );
}
