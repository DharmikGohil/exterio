import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { AuthService } from '@/application/features/auth/AuthService';
import type { IAuthService } from '@/domain/interfaces/auth';
import type { User } from '@/domain/models/auth';
import { AuthRepository } from '@/infrastructure/api/auth/AuthRepository';
import { AUTH_QUERY_KEYS } from '@/presentation/features/auth/hooks/authQueryKeys';
import { useHttpClientContext } from '@/presentation/shared/contexts/HttpClientContext';

interface AuthContextType {
  authService: IAuthService;
  /** `true` while a session token is stored. */
  isAuthenticated: boolean;
  /** Marks the user as signed in (the service has already stored the token). */
  startSession: (user: User) => void;
  /** Signs out: forgets the token and every cached server response. */
  endSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { httpClient, tokenStorage, setUnauthorizedHandler } = useHttpClientContext();
  const queryClient = useQueryClient();

  const authService = useMemo(() => {
    const authRepository = new AuthRepository(httpClient);
    return new AuthService(authRepository, tokenStorage);
  }, [httpClient, tokenStorage]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.hasSession());

  const startSession = useCallback(
    (user: User) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser(), user);
      setIsAuthenticated(true);
    },
    [queryClient]
  );

  const endSession = useCallback(() => {
    authService.logout();
    queryClient.clear();
    setIsAuthenticated(false);
  }, [authService, queryClient]);

  // Any 401 from the API means the session is no longer valid.
  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return () => setUnauthorizedHandler(() => undefined);
  }, [setUnauthorizedHandler, endSession]);

  const value = useMemo(
    () => ({ authService, isAuthenticated, startSession, endSession }),
    [authService, isAuthenticated, startSession, endSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
