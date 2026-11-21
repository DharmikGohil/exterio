import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import type { RenderStatus } from '@/domain/models/design';

export interface RenderControlsProps {
  status: RenderStatus;
  /** Failure message from the server when `status` is `failed`. */
  error: string | null;
  /** `false` when the server has no photoreal renderer configured. */
  isAvailable: boolean;
  isCheckingAvailability: boolean;
  isRequesting: boolean;
  onGenerate: () => void;
}

/** The "Generate photoreal render" button with its progress, failure and unavailable states. */
export function RenderControls({
  status,
  error,
  isAvailable,
  isCheckingAvailability,
  isRequesting,
  onGenerate,
}: RenderControlsProps) {
  const isPending = status === 'pending';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          variant="secondary"
          icon="image"
          disabled={!isAvailable || isPending}
          isLoading={isRequesting || isPending}
          onClick={onGenerate}
        >
          {status === 'done' ? 'Regenerate photoreal render' : 'Generate photoreal render'}
        </Button>
        <p className="min-w-0 flex-1 basis-56 text-sm leading-relaxed text-stone-600">
          {isAvailable || isCheckingAvailability
            ? 'The instant preview updates as you click. A photoreal render takes about a minute and adds realistic light and texture.'
            : 'Photoreal rendering is not configured on this server. The instant preview still shows every finish you apply.'}
        </p>
      </div>

      {isPending && (
        <Alert tone="info" title="Creating your photoreal render…">
          This usually takes under a minute. You can keep working; it appears here when ready.
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
