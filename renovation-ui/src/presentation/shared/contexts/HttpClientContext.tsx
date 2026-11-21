import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';

import { config } from '@/config';
import type { ITokenStorage } from '@/domain/interfaces/auth';
import { createHttpClient } from '@/infrastructure/utils/http/httpClientFactory';
import { LocalStorageTokenStorage } from '@/infrastructure/utils/http/tokenStorage';
import type { IHttpClient } from '@/infrastructure/utils/http/types';

interface HttpClientContextType {
  /** The one HTTP client shared by every repository. */
  httpClient: IHttpClient;
  tokenStorage: ITokenStorage;
  /** Registers what happens when any request comes back 401 (the auth feature logs out). */
  setUnauthorizedHandler: (handler: () => void) => void;
}

const HttpClientContext = createContext<HttpClientContextType | undefined>(undefined);

interface HttpClientProviderProps {
  children: ReactNode;
}

export function HttpClientProvider({ children }: HttpClientProviderProps) {
  const unauthorizedHandlerRef = useRef<() => void>(() => undefined);

  const value = useMemo<HttpClientContextType>(() => {
    const tokenStorage = new LocalStorageTokenStorage(config.tokenStorageKey);
    const httpClient = createHttpClient(tokenStorage, () => unauthorizedHandlerRef.current());
    return {
      httpClient,
      tokenStorage,
      setUnauthorizedHandler: (handler) => {
        unauthorizedHandlerRef.current = handler;
      },
    };
  }, []);

  return <HttpClientContext.Provider value={value}>{children}</HttpClientContext.Provider>;
}

export function useHttpClientContext(): HttpClientContextType {
  const context = useContext(HttpClientContext);
  if (context === undefined) {
    throw new Error('useHttpClientContext must be used within an HttpClientProvider');
  }
  return context;
}
