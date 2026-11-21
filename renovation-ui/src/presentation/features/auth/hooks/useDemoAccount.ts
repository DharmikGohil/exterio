import { useQuery } from '@tanstack/react-query';

import { useAuthContext } from '@/presentation/features/auth/contexts/AuthContext';

import { AUTH_QUERY_KEYS } from './authQueryKeys';

/** The reviewer sign-in this deployment publishes, or `null` when it has none. */
export function useDemoAccount() {
  const { authService } = useAuthContext();

  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEYS.demoAccount(),
    queryFn: () => authService.getDemoAccount(),
    staleTime: Infinity,
    retry: false,
  });

  return { demoAccount: data ?? null, isLoading };
}
