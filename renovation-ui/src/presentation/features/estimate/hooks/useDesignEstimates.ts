import { useQueries } from '@tanstack/react-query';

import type { Design } from '@/domain/models/design';
import type { EstimateTotals } from '@/domain/models/estimate';
import { useEstimateContext } from '@/presentation/features/estimate/contexts/EstimateContext';

import { ESTIMATE_QUERY_KEYS } from './estimateQueryKeys';

export interface DesignEstimateSummary {
  design: Design;
  totals: EstimateTotals | undefined;
  isLoading: boolean;
  hasError: boolean;
}

/** Totals for every design of a project, for the side-by-side comparison. */
export function useDesignEstimates(designs: readonly Design[]): DesignEstimateSummary[] {
  const { estimateService } = useEstimateContext();

  return useQueries({
    queries: designs.map((design) => ({
      queryKey: ESTIMATE_QUERY_KEYS.detail(design.id),
      queryFn: () => estimateService.getEstimate(design.id),
    })),
    combine: (results) =>
      results.map((result, index) => ({
        design: designs[index],
        totals: result.data?.totals,
        isLoading: result.isLoading,
        hasError: result.isError,
      })),
  });
}
