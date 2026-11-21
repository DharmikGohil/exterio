import { useCallback } from 'react';

import type { Project, RateOverride } from '@/domain/models/project';
import { useProjectCache } from '@/presentation/features/projects/hooks/useProjectCache';
import { useRateOverrideActions } from '@/presentation/features/projects/hooks/useRateOverrideActions';

export type RateField = keyof RateOverride;

/**
 * Per-project rate and wastage overrides, keyed by material.
 * Every change sends the full overrides map; the estimate is refetched once it is saved.
 */
export function useRateOverrides(project: Project) {
  const cache = useProjectCache();
  const { saveRateOverrides, isSavingRates } = useRateOverrideActions(project.id);

  const getLatestOverrides = useCallback(
    () => cache.getProject(project.id)?.rateOverrides ?? project.rateOverrides,
    [cache, project.id, project.rateOverrides]
  );

  const setRate = useCallback(
    (materialId: string, field: RateField, value: number) => {
      const current = getLatestOverrides();
      saveRateOverrides({
        ...current,
        [materialId]: { ...current[materialId], [field]: value },
      });
    },
    [getLatestOverrides, saveRateOverrides]
  );

  /** Back to the catalog rates and wastage for one material. */
  const resetRates = useCallback(
    (materialId: string) => {
      const next = { ...getLatestOverrides() };
      delete next[materialId];
      saveRateOverrides(next);
    },
    [getLatestOverrides, saveRateOverrides]
  );

  return { overrides: project.rateOverrides, setRate, resetRates, isSavingRates };
}
