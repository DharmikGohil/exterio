import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { SystemService } from '@/application/features/system/SystemService';
import type { ISystemService } from '@/domain/interfaces/system';
import { SystemRepository } from '@/infrastructure/api/system/SystemRepository';
import { useHttpClientContext } from '@/presentation/shared/contexts/HttpClientContext';

interface SystemContextType {
  systemService: ISystemService;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

interface SystemProviderProps {
  children: ReactNode;
}

/** Composition root for the system feature: repository -> service, shared via context. */
export function SystemProvider({ children }: SystemProviderProps) {
  const { httpClient } = useHttpClientContext();

  const services = useMemo(() => {
    const systemRepository = new SystemRepository(httpClient);
    const systemService = new SystemService(systemRepository);
    return { systemService };
  }, [httpClient]);

  return <SystemContext.Provider value={services}>{children}</SystemContext.Provider>;
}

export function useSystemContext(): SystemContextType {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystemContext must be used within a SystemProvider');
  }
  return context;
}
