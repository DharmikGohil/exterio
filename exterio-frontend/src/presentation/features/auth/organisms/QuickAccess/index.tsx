import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { getErrorMessage } from '@/presentation/shared/utils/errors';
import { useAuthActions } from '@/presentation/features/auth/hooks/useAuthActions';
import { useDemoAccount } from '@/presentation/features/auth/hooks/useDemoAccount';
import { DemoAccountCard } from '@/presentation/features/auth/molecules/DemoAccountCard';
import { GuestAccessCard } from '@/presentation/features/auth/organisms/GuestAccessCard';

/**
 * The way in without an account of your own: the published demo account when the deployment has
 * one, otherwise a guest session.
 */
export function QuickAccess() {
  const { demoAccount, isLoading } = useDemoAccount();
  const { signInWithDemo, isSigningInWithDemo, demoLoginError } = useAuthActions();

  if (isLoading) {
    return <Skeleton className="h-[188px] w-full rounded-xl" />;
  }
  if (!demoAccount) {
    return <GuestAccessCard />;
  }
  return (
    <DemoAccountCard
      account={demoAccount}
      onSignIn={() => signInWithDemo(demoAccount)}
      isSigningIn={isSigningInWithDemo}
      errorMessage={demoLoginError ? getErrorMessage(demoLoginError) : null}
    />
  );
}
