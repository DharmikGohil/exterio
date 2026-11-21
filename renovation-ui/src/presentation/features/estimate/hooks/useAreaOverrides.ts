import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { Project, Region, RegionInput } from '@/domain/models/project';
import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';
import { PROJECT_QUERY_KEYS } from '@/presentation/features/projects/hooks/projectQueryKeys';
import { useProjectCache } from '@/presentation/features/projects/hooks/useProjectCache';
import { useToast } from '@/presentation/shared/hooks/useToast';

export type RegionOverridePatch = Partial<Pick<Region, 'areaOverrideSqft' | 'lengthOverrideFt'>>;

const overrideMutationKey = (projectId: string) =>
  [...PROJECT_QUERY_KEYS.detail(projectId), 'measurement-overrides'] as const;

/**
 * User-typed areas and lengths that replace the measured ones.
 * They are stored on the regions, so each change is a full `PUT regions`. The cache is
 * patched optimistically and saves run one at a time so quick edits build on each other.
 */
export function useAreaOverrides(project: Project) {
  const { projectService } = useProjectContext();
  const queryClient = useQueryClient();
  const cache = useProjectCache();
  const toast = useToast();
  const projectId = project.id;
  const mutationKey = overrideMutationKey(projectId);

  const { mutate } = useMutation({
    mutationKey,
    scope: { id: mutationKey.join(':') },
    mutationFn: (regions: Region[]) => {
      const inputs: RegionInput[] = regions.map((region) => ({ ...region }));
      return projectService.saveRegions(projectId, inputs);
    },
    onMutate: (regions) => {
      cache.patchProject(projectId, (current) => ({ ...current, regions }));
    },
    onSuccess: (updated) => {
      // A newer edit is still queued: keep its optimistic regions instead of this older answer.
      const hasNewerEdit = queryClient.isMutating({ mutationKey }) > 1;
      const latest = cache.getProject(projectId);
      cache.setProject(hasNewerEdit && latest ? { ...updated, regions: latest.regions } : updated);
    },
    onError: (error) => {
      toast.error(error);
      void cache.invalidateProject(projectId);
    },
  });

  const patchRegion = useCallback(
    (regionId: string, patch: RegionOverridePatch) => {
      const regions = cache.getProject(projectId)?.regions ?? project.regions;
      mutate(regions.map((region) => (region.id === regionId ? { ...region, ...patch } : region)));
    },
    [cache, projectId, project.regions, mutate]
  );

  const setAreaOverride = useCallback(
    (regionId: string, areaSqft: number) => patchRegion(regionId, { areaOverrideSqft: areaSqft }),
    [patchRegion]
  );

  const setLengthOverride = useCallback(
    (regionId: string, lengthFt: number) => patchRegion(regionId, { lengthOverrideFt: lengthFt }),
    [patchRegion]
  );

  /** Goes back to the measured area and length. */
  const resetOverrides = useCallback(
    (regionId: string) => patchRegion(regionId, { areaOverrideSqft: null, lengthOverrideFt: null }),
    [patchRegion]
  );

  const isSavingOverrides = useIsMutating({ mutationKey }) > 0;

  return { setAreaOverride, setLengthOverride, resetOverrides, isSavingOverrides };
}
