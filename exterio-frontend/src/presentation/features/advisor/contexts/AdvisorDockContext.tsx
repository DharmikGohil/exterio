import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useDisclosure } from '@/presentation/shared/hooks/useDisclosure';
import { cn } from '@/presentation/shared/utils/cn';
import { AdvisorPanel } from '@/presentation/features/advisor/organisms/AdvisorPanel';
import { useCapabilities } from '@/presentation/features/system/hooks/useCapabilities';

interface AdvisorDockContextType {
  /** `false` when the server has no advisor configured: buttons should not appear. */
  isAvailable: boolean;
  isOpen: boolean;
  open: () => void;
}

const AdvisorDockContext = createContext<AdvisorDockContextType | undefined>(undefined);

export interface AdvisorDockProviderProps {
  projectId: string;
  designId: string | undefined;
  designName: string | undefined;
  children: ReactNode;
}

/**
 * Hosts the material advisor's chat panel for the whole studio. The panel stays mounted while
 * closed and across steps, so the conversation is kept; any step opens it with `AdvisorButton`.
 */
export function AdvisorDockProvider({
  projectId,
  designId,
  designName,
  children,
}: AdvisorDockProviderProps) {
  const { capabilities } = useCapabilities();
  const panel = useDisclosure();
  const value = useMemo(
    () => ({ isAvailable: capabilities.advisor, isOpen: panel.isOpen, open: panel.open }),
    [capabilities.advisor, panel.isOpen, panel.open]
  );

  return (
    <AdvisorDockContext.Provider value={value}>
      {children}
      {capabilities.advisor && (
        <div className={cn(!panel.isOpen && 'hidden')}>
          <AdvisorPanel
            projectId={projectId}
            designId={designId}
            designName={designName}
            isOpen={panel.isOpen}
            onClose={panel.close}
          />
        </div>
      )}
    </AdvisorDockContext.Provider>
  );
}

export function useAdvisorDock(): AdvisorDockContextType {
  const context = useContext(AdvisorDockContext);
  if (!context) {
    throw new Error('useAdvisorDock must be used inside an AdvisorDockProvider');
  }
  return context;
}
