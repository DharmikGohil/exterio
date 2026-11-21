import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import { getErrorMessage } from '@/presentation/shared/utils/errors';

export interface ErrorStateProps {
  title: string;
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

/** Inline "this failed to load" block with an optional retry. */
export function ErrorState({ title, error, onRetry, className }: ErrorStateProps) {
  return (
    <Alert
      tone="error"
      title={title}
      className={className}
      action={
        onRetry && (
          <Button variant="outline" size="sm" icon="reset" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    >
      {getErrorMessage(error)}
    </Alert>
  );
}
