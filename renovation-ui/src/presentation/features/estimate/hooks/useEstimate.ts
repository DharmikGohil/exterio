import { useQuery } from '@tanstack/react-query';

import { useEstimateContext } from '@/presentation/features/estimate/contexts/EstimateContext';

import { ESTIMATE_QUERY_KEYS } from './estimateQueryKeys';

/** Areas, quantities and costs for one design. Always computed fresh by the server. */
export function useEstimate(designId: string | null) {
  const { estimateService } = useEstimateContext();

  const {
    data: estimate,
    isLoading,
    isFetching,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ESTIMATE_QUERY_KEYS.detail(designId ?? ''),
    queryFn: () => estimateService.getEstimate(designId ?? ''),
    enabled: designId !== null,
  });

  return {
    estimate,
    isLoading,
    isFetching,
    error,
    refetch,
    /** Changes every time fresh numbers arrive; inline editors use it to resync. */
    dataUpdatedAt,
  };
}
