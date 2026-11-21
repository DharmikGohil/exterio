import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import { getErrorMessage } from '@/presentation/shared/utils/errors';
import { useAuthActions } from '@/presentation/features/auth/hooks/useAuthActions';

/** The fastest way in: one button, no account. */
export function GuestAccessCard() {
  const { continueAsGuest, isStartingGuestSession, guestError } = useAuthActions();

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        fullWidth
        isLoading={isStartingGuestSession}
        onClick={() => continueAsGuest()}
      >
        Continue as guest
      </Button>
      <p className="text-center text-xs text-stone-500">
        No sign-up. Projects stay with this browser
      </p>
      {guestError && <Alert tone="error">{getErrorMessage(guestError)}</Alert>}
    </div>
  );
}
