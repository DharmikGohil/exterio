import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { EstimateService } from '@/application/features/estimate/EstimateService';
import type { IEstimateService } from '@/domain/interfaces/estimate';
import { EstimateRepository } from '@/infrastructure/api/estimate/EstimateRepository';
import { useHttpClientContext } from '@/presentation/shared/contexts/HttpClientContext';

interface EstimateContextType {
  estimateService: IEstimateService;
}

const EstimateContext = createContext<EstimateContextType | undefined>(undefined);

interface EstimateProviderProps {
  children: ReactNode;
}

/** Composition root for the estimate feature: repository -> service, shared via context. */
export function EstimateProvider({ children }: EstimateProviderProps) {
  const { httpClient } = useHttpClientContext();

  const services = useMemo(() => {
    const estimateRepository = new EstimateRepository(httpClient);
    const estimateService = new EstimateService(estimateRepository);
    return { estimateService };
  }, [httpClient]);

  return <EstimateContext.Provider value={services}>{children}</EstimateContext.Provider>;
}

export function useEstimateContext(): EstimateContextType {
  const context = useContext(EstimateContext);
  if (context === undefined) {
    throw new Error('useEstimateContext must be used within a EstimateProvider');
  }
  return context;
}
