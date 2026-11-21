import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { Design, DesignAssignments } from '@/domain/models/design';
import { useDesignContext } from '@/presentation/features/design/contexts/DesignContext';
import { useProjectCache } from '@/presentation/features/projects/hooks/useProjectCache';
import { useToast } from '@/presentation/shared/hooks/useToast';

import { DESIGN_QUERY_KEYS } from './designQueryKeys';

/**
 * Applies and clears materials on a design.
 *
 * Every change sends the full `assignments` map. The cache is updated optimistically and
 * saves for the same design run one at a time, so quick successive clicks build on each
 * other and the preview the server returns last is the one for the final state.
 */
export function useDesignAssignments(design: Design) {
  const { designService } = useDesignContext();
  const queryClient = useQueryClient();
  const cache = useProjectCache();
  const toast = useToast();
  const { id: designId, projectId } = design;
  const mutationKey = DESIGN_QUERY_KEYS.assignments(designId);

  const { mutate } = useMutation({
    mutationKey,
    scope: { id: mutationKey.join(':') },
    mutationFn: (assignments: DesignAssignments) =>
      designService.updateDesign(designId, { assignments }),
    onMutate: (assignments) => {
      cache.patchDesign(projectId, designId, (current) => ({ ...current, assignments }));
    },
    onSuccess: (updated) => {
      // A newer change is still queued: take the new preview but keep the newer assignments.
      const hasNewerChange = queryClient.isMutating({ mutationKey }) > 1;
      cache.patchDesign(projectId, designId, (current) =>
        hasNewerChange ? { ...updated, assignments: current.assignments } : updated
      );
      void cache.invalidateEstimate(designId);
    },
    onError: (error) => {
      toast.error(error);
      void cache.invalidateProject(projectId);
    },
  });

  const getLatestAssignments = useCallback((): DesignAssignments => {
    const cached = cache.getProject(projectId)?.designs.find((item) => item.id === designId);
    return cached?.assignments ?? design.assignments;
  }, [cache, projectId, designId, design.assignments]);

  /** Applies one material to one or more regions. */
  const assignMaterial = useCallback(
    (regionIds: readonly string[], materialId: string) => {
      const next = { ...getLatestAssignments() };
      for (const regionId of regionIds) {
        next[regionId] = materialId;
      }
      mutate(next);
    },
    [getLatestAssignments, mutate]
  );

  /** Removes the material from one or more regions. */
  const clearMaterial = useCallback(
    (regionIds: readonly string[]) => {
      const next = { ...getLatestAssignments() };
      for (const regionId of regionIds) {
        delete next[regionId];
      }
      mutate(next);
    },
    [getLatestAssignments, mutate]
  );

  const isUpdating = useIsMutating({ mutationKey }) > 0;

  return { assignMaterial, clearMaterial, isUpdating };
}
