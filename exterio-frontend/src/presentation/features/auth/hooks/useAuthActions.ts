import { useMutation } from '@tanstack/react-query';

import type { AuthResponse, LoginParams, RegisterFormParams } from '@/domain/models/auth';
import { useAuthContext } from '@/presentation/features/auth/contexts/AuthContext';

/** The email form's sign-in and sign-up. Each one starts the session on success. */
export function useAuthActions() {
  const { authService, startSession } = useAuthContext();
  const onSuccess = (response: AuthResponse) => startSession(response.user);

  const login = useMutation({
    mutationFn: (params: LoginParams) => authService.login(params),
    onSuccess,
  });

  const register = useMutation({
    mutationFn: (params: RegisterFormParams) => authService.register(params),
    onSuccess,
  });

  return {
    login: login.mutate,
    isLoggingIn: login.isPending,
    loginError: login.error,
    resetLoginState: login.reset,

    register: register.mutate,
    isRegistering: register.isPending,
    registerError: register.error,
    resetRegisterState: register.reset,
  };
}
