import { useMutation } from '@tanstack/react-query';

import { useAuthContext } from '@/presentation/features/auth/contexts/AuthContext';
import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';

import { useDemoAccount } from './useDemoAccount';

/**
 * The way in without an account of your own, always onto a sample house: the published demo
 * account when this deployment has one (it is seeded with the sample house), otherwise a guest
 * session with a sample house created for it before the session is shown.
 */
export function useSampleHouseSignIn() {
  const { authService, startSession } = useAuthContext();
  const { projectService } = useProjectContext();
  const { demoAccount, isLoading } = useDemoAccount();

  const signIn = useMutation({
    mutationFn: async () => {
      if (demoAccount) {
        return authService.login(demoAccount);
      }
      const response = await authService.loginAsGuest();
      await projectService.createSampleProject();
      return response;
    },
    onSuccess: (response) => startSession(response.user),
  });

  return {
    signInToSample: () => signIn.mutate(),
    isReady: !isLoading,
    isSigningIn: signIn.isPending,
    error: signIn.error,
  };
}
