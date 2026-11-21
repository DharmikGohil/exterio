import { useQuery } from '@tanstack/react-query';

import { useAuthContext } from '@/presentation/features/auth/contexts/AuthContext';

import { AUTH_QUERY_KEYS } from './authQueryKeys';

/** The signed-in user (guest or registered). */
export function useCurrentUser() {
  const { authService, isAuthenticated } = useAuthContext();

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEYS.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: Infinity,
  });

  return { user, isLoading };
}
