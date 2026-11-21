import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { DesignService } from '@/application/features/design/DesignService';
import type { IDesignService } from '@/domain/interfaces/design';
import { DesignRepository } from '@/infrastructure/api/design/DesignRepository';
import { useHttpClientContext } from '@/presentation/shared/contexts/HttpClientContext';

interface DesignContextType {
  designService: IDesignService;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

interface DesignProviderProps {
  children: ReactNode;
}

/** Composition root for the design feature: repository -> service, shared via context. */
export function DesignProvider({ children }: DesignProviderProps) {
  const { httpClient } = useHttpClientContext();

  const services = useMemo(() => {
    const designRepository = new DesignRepository(httpClient);
    const designService = new DesignService(designRepository);
    return { designService };
  }, [httpClient]);

  return <DesignContext.Provider value={services}>{children}</DesignContext.Provider>;
}

export function useDesignContext(): DesignContextType {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesignContext must be used within a DesignProvider');
  }
  return context;
}
