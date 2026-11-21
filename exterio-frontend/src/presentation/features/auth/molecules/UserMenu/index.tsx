import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { useCurrentUser } from '@/presentation/features/auth/hooks/useCurrentUser';
import { useLogout } from '@/presentation/features/auth/hooks/useLogout';
import { AccountMenu } from '@/presentation/features/auth/molecules/AccountMenu';

/** The account menu in the app header, wired to the signed-in user and sign-out. */
export function UserMenu() {
  const { user, isLoading } = useCurrentUser();
  const logout = useLogout();

  if (isLoading || !user) {
    return <Skeleton className="h-9 w-14 rounded-full" />;
  }
  return <AccountMenu user={user} onSignOut={logout} />;
}
