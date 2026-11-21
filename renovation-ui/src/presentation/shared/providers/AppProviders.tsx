import type { ReactNode } from 'react';

import { AdvisorProvider } from '@/presentation/features/advisor/contexts/AdvisorContext';
import { AuthProvider } from '@/presentation/features/auth/contexts/AuthContext';
import { DesignProvider } from '@/presentation/features/design/contexts/DesignContext';
import { EstimateProvider } from '@/presentation/features/estimate/contexts/EstimateContext';
import { MaterialProvider } from '@/presentation/features/materials/contexts/MaterialContext';
import { ProjectProvider } from '@/presentation/features/projects/contexts/ProjectContext';
import { SystemProvider } from '@/presentation/features/system/contexts/SystemContext';
import { HttpClientProvider } from '@/presentation/shared/contexts/HttpClientContext';
import { ToastProvider } from '@/presentation/shared/contexts/ToastContext';
import { Toaster } from '@/presentation/shared/organisms/Toaster';

import { QueryProvider } from './QueryProvider';

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Everything the routed pages rely on, outermost first:
 * server-state cache, toasts, the shared HTTP client, the session, then one provider per
 * feature that wires its repository into its service.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <ToastProvider>
        <HttpClientProvider>
          <AuthProvider>
            <SystemProvider>
              <ProjectProvider>
                <MaterialProvider>
                  <DesignProvider>
                    <EstimateProvider>
                      <AdvisorProvider>{children}</AdvisorProvider>
                    </EstimateProvider>
                  </DesignProvider>
                </MaterialProvider>
              </ProjectProvider>
            </SystemProvider>
          </AuthProvider>
        </HttpClientProvider>
        <Toaster />
      </ToastProvider>
    </QueryProvider>
  );
}
