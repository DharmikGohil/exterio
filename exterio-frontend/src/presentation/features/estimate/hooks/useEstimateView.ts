import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { STUDIO_PARAMS } from '@/presentation/routes/paths';

export type EstimateView = 'overview' | 'breakdown';

/**
 * Whether the estimate shows its overview (the house with its parts) or the full breakdown, kept
 * in the `?view=` query parameter so the browser's Back button returns to the overview.
 */
export function useEstimateView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: EstimateView =
    searchParams.get(STUDIO_PARAMS.view) === 'breakdown' ? 'breakdown' : 'overview';

  const setView = useCallback(
    (next: EstimateView) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (next === 'breakdown') {
          params.set(STUDIO_PARAMS.view, next);
        } else {
          params.delete(STUDIO_PARAMS.view);
        }
        return params;
      });
      window.scrollTo({ top: 0 });
    },
    [setSearchParams]
  );

  return {
    view,
    openBreakdown: () => setView('breakdown'),
    openOverview: () => setView('overview'),
  };
}
