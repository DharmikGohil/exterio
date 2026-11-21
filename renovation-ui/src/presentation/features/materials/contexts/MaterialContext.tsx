import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { MaterialService } from '@/application/features/material/MaterialService';
import type { IMaterialService } from '@/domain/interfaces/material';
import { MaterialRepository } from '@/infrastructure/api/material/MaterialRepository';
import { useHttpClientContext } from '@/presentation/shared/contexts/HttpClientContext';

interface MaterialContextType {
  materialService: IMaterialService;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

interface MaterialProviderProps {
  children: ReactNode;
}

/** Composition root for the material feature: repository -> service, shared via context. */
export function MaterialProvider({ children }: MaterialProviderProps) {
  const { httpClient } = useHttpClientContext();

  const services = useMemo(() => {
    const materialRepository = new MaterialRepository(httpClient);
    const materialService = new MaterialService(materialRepository);
    return { materialService };
  }, [httpClient]);

  return <MaterialContext.Provider value={services}>{children}</MaterialContext.Provider>;
}

export function useMaterialContext(): MaterialContextType {
  const context = useContext(MaterialContext);
  if (context === undefined) {
    throw new Error('useMaterialContext must be used within a MaterialProvider');
  }
  return context;
}
