import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';

import type { RateOverrides } from '@/domain/models/project';
import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';
import { useToast } from '@/presentation/shared/hooks/useToast';

import { PROJECT_QUERY_KEYS } from './projectQueryKeys';
import { useProjectCache } from './useProjectCache';

const rateMutationKey = (projectId: string) =>
  [...PROJECT_QUERY_KEYS.detail(projectId), 'rates'] as const;

/**
 * Saves the project's rate overrides (full replace).
 * The cache is updated optimistically and saves run one at a time, so several quick edits
 * always build on each other and the last one wins on the server too.
 */
export function useRateOverrideActions(projectId: string) {
  const { projectService } = useProjectContext();
  const queryClient = useQueryClient();
  const cache = useProjectCache();
  const toast = useToast();
  const mutationKey = rateMutationKey(projectId);

  const { mutate: saveRateOverrides } = useMutation({
    mutationKey,
    scope: { id: mutationKey.join(':') },
    mutationFn: (overrides: RateOverrides) =>
      projectService.saveRateOverrides(projectId, overrides),
    onMutate: (overrides) => {
      cache.patchProject(projectId, (project) => ({ ...project, rateOverrides: overrides }));
    },
    onSuccess: (project) => {
      // A newer edit is still queued: keep its optimistic value instead of this older answer.
      const hasNewerEdit = queryClient.isMutating({ mutationKey }) > 1;
      const latest = cache.getProject(projectId);
      cache.setProject(
        hasNewerEdit && latest ? { ...project, rateOverrides: latest.rateOverrides } : project
      );
    },
    onError: (error) => {
      toast.error(error);
      void cache.invalidateProject(projectId);
    },
  });

  const isSavingRates = useIsMutating({ mutationKey }) > 0;

  return { saveRateOverrides, isSavingRates };
}
