import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';

export interface SampleHouseButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  errorMessage?: string | null;
}

/** "Try it with a sample house": one click into a house that is already set up. */
export function SampleHouseButton({
  onClick,
  isLoading,
  disabled = false,
  errorMessage,
}: SampleHouseButtonProps) {
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={disabled}
        onClick={onClick}
      >
        Try it with a sample house
      </Button>
      <p className="text-center text-sm leading-relaxed text-stone-500">
        No sign-up needed. A sample house is already set up so you can try every step.
      </p>
      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
    </div>
  );
}
