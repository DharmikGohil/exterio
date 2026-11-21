import { useMutation } from '@tanstack/react-query';

import type { AuthResponse, LoginParams, RegisterFormParams } from '@/domain/models/auth';
import { useAuthContext } from '@/presentation/features/auth/contexts/AuthContext';

/** Sign-in mutations. Each one starts the session on success. */
export function useAuthActions() {
  const { authService, startSession } = useAuthContext();
  const onSuccess = (response: AuthResponse) => startSession(response.user);

  const guest = useMutation({
    mutationFn: () => authService.loginAsGuest(),
    onSuccess,
  });

  const login = useMutation({
    mutationFn: (params: LoginParams) => authService.login(params),
    onSuccess,
  });

  // Separate from `login`, so the demo button and the form show their own progress and errors.
  const demoLogin = useMutation({
    mutationFn: (params: LoginParams) => authService.login(params),
    onSuccess,
  });

  const register = useMutation({
    mutationFn: (params: RegisterFormParams) => authService.register(params),
    onSuccess,
  });

  return {
    continueAsGuest: guest.mutate,
    isStartingGuestSession: guest.isPending,
    guestError: guest.error,

    login: login.mutate,
    isLoggingIn: login.isPending,
    loginError: login.error,
    resetLoginState: login.reset,

    signInWithDemo: demoLogin.mutate,
    isSigningInWithDemo: demoLogin.isPending,
    demoLoginError: demoLogin.error,

    register: register.mutate,
    isRegistering: register.isPending,
    registerError: register.error,
    resetRegisterState: register.reset,
  };
}
