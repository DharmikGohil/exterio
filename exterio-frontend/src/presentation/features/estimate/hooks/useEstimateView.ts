import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { STUDIO_PARAMS } from '@/presentation/routes/paths';

export type EstimateView = 'overview' | 'breakdown' | 'size';

const SUB_VIEWS: readonly EstimateView[] = ['breakdown', 'size'];

/**
 * Which page of the estimate is open: the overview (the house with its parts), the full
 * breakdown, or the real-world size. Kept in the `?view=` query parameter so the browser's Back
 * button returns to the overview.
 */
export function useEstimateView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get(STUDIO_PARAMS.view);
  const view = SUB_VIEWS.find((item) => item === requested) ?? 'overview';

  const setView = useCallback(
    (next: EstimateView) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (next !== 'overview') {
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
    openSize: () => setView('size'),
    openOverview: () => setView('overview'),
  };
}
