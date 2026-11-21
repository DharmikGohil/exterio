import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { AdvisorService } from '@/application/features/advisor/AdvisorService';
import type { IAdvisorService } from '@/domain/interfaces/advisor';
import { AdvisorRepository } from '@/infrastructure/api/advisor/AdvisorRepository';
import { useHttpClientContext } from '@/presentation/shared/contexts/HttpClientContext';

interface AdvisorContextType {
  advisorService: IAdvisorService;
}

const AdvisorContext = createContext<AdvisorContextType | undefined>(undefined);

interface AdvisorProviderProps {
  children: ReactNode;
}

/** Composition root for the advisor feature: repository -> service, shared via context. */
export function AdvisorProvider({ children }: AdvisorProviderProps) {
  const { httpClient } = useHttpClientContext();

  const services = useMemo(() => {
    const advisorRepository = new AdvisorRepository(httpClient);
    const advisorService = new AdvisorService(advisorRepository);
    return { advisorService };
  }, [httpClient]);

  return <AdvisorContext.Provider value={services}>{children}</AdvisorContext.Provider>;
}

export function useAdvisorContext(): AdvisorContextType {
  const context = useContext(AdvisorContext);
  if (context === undefined) {
    throw new Error('useAdvisorContext must be used within a AdvisorProvider');
  }
  return context;
}
