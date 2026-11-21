import { useQuery } from '@tanstack/react-query';

import type { Capabilities } from '@/domain/models/system';
import { useSystemContext } from '@/presentation/features/system/contexts/SystemContext';

export const SYSTEM_QUERY_KEYS = {
  all: ['system'] as const,
  capabilities: () => [...SYSTEM_QUERY_KEYS.all, 'capabilities'] as const,
};

/** Until the server answers, every optional AI feature is treated as unavailable. */
const NO_CAPABILITIES: Capabilities = {
  autoDetect: false,
  photorealRender: false,
  visionCheck: false,
  advisor: false,
};

/** Which optional AI features this server has configured. */
export function useCapabilities() {
  const { systemService } = useSystemContext();

  const { data, isLoading } = useQuery({
    queryKey: SYSTEM_QUERY_KEYS.capabilities(),
    queryFn: () => systemService.getCapabilities(),
    staleTime: Infinity,
  });

  return { capabilities: data ?? NO_CAPABILITIES, isLoading };
}
