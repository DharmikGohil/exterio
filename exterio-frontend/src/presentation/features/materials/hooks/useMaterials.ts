import { useQuery } from '@tanstack/react-query';

import { useMaterialContext } from '@/presentation/features/materials/contexts/MaterialContext';

export const MATERIAL_QUERY_KEYS = {
  all: ['materials'] as const,
  list: () => [...MATERIAL_QUERY_KEYS.all, 'list'] as const,
};

/** The material catalog. It rarely changes, so it is cached for the whole session. */
export function useMaterials() {
  const { materialService } = useMaterialContext();

  const {
    data: materials = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: MATERIAL_QUERY_KEYS.list(),
    queryFn: () => materialService.listMaterials(),
    staleTime: Infinity,
  });

  return { materials, isLoading, error, refetch };
}
