import { getErrorMessage } from '@/presentation/shared/utils/errors';
import { useSampleHouseSignIn } from '@/presentation/features/auth/hooks/useSampleHouseSignIn';
import { SampleHouseButton } from '@/presentation/features/auth/molecules/SampleHouseButton';

/** The sign-in page's way in without an account, onto a house that is already set up. */
export function SampleHouseAccess() {
  const { signInToSample, isReady, isSigningIn, error } = useSampleHouseSignIn();

  return (
    <SampleHouseButton
      onClick={signInToSample}
      isLoading={isSigningIn}
      disabled={!isReady}
      errorMessage={error ? getErrorMessage(error) : null}
    />
  );
}
