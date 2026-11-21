import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthContext } from '@/presentation/features/auth/contexts/AuthContext';
import { ROUTES } from '@/presentation/routes/paths';

export interface AuthGuardProps {
  children: ReactNode;
}

/** Only signed-in users get past; everyone else is sent to the login page. */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
