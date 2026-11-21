import { Badge } from '@/presentation/shared/atoms/Badge';
import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { useCurrentUser } from '@/presentation/features/auth/hooks/useCurrentUser';
import { useLogout } from '@/presentation/features/auth/hooks/useLogout';

/** Who is signed in, plus the sign-out button. Lives in the app header. */
export function UserMenu() {
  const { user, isLoading } = useCurrentUser();
  const logout = useLogout();

  return (
    <div className="flex min-w-0 items-center gap-2">
      {isLoading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        user && (
          <span className="flex min-w-0 items-center gap-2 text-sm text-stone-700">
            <Icon name="user" className="hidden text-stone-400 sm:block" />
            <span className="hidden max-w-[12rem] truncate sm:block">{user.name}</span>
            {user.isGuest && <Badge tone="brand">Guest</Badge>}
          </span>
        )
      )}
      <Button variant="ghost" size="sm" icon="logout" onClick={logout}>
        <span className="hidden sm:inline">Sign out</span>
        <span className="sr-only sm:hidden">Sign out</span>
      </Button>
    </div>
  );
}
