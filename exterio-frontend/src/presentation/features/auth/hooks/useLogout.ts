import { useAuthContext } from '@/presentation/features/auth/contexts/AuthContext';

/** Ends the session; the auth guard then redirects to the login page. */
export function useLogout() {
  const { endSession } = useAuthContext();
  return endSession;
}
