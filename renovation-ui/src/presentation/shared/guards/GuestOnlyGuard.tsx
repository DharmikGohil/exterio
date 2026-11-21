import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthContext } from '@/presentation/features/auth/contexts/AuthContext';
import { ROUTES } from '@/presentation/routes/paths';

export interface GuestOnlyGuardProps {
  children: ReactNode;
}

interface RedirectState {
  from?: { pathname?: string; search?: string };
}

/** Keeps signed-in users away from the login page and returns them to where they were going. */
export function GuestOnlyGuard({ children }: GuestOnlyGuardProps) {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as RedirectState | null)?.from;
    const target = from?.pathname ? `${from.pathname}${from.search ?? ''}` : ROUTES.home;
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}
