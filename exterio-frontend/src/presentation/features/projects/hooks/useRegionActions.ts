import { useMutation } from '@tanstack/react-query';

import type { RegionInput } from '@/domain/models/project';
import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';
import { useToast } from '@/presentation/shared/hooks/useToast';

import { useProjectCache } from './useProjectCache';

/** Save (full replace) and AI auto-detect for a project's regions. */
export function useRegionActions(projectId: string) {
  const { projectService } = useProjectContext();
  const cache = useProjectCache();
  const toast = useToast();

  const save = useMutation({
    // One save at a time per project so a later edit can never be overwritten by an earlier one.
    scope: { id: `project-regions-${projectId}` },
    mutationFn: (regions: RegionInput[]) => projectService.saveRegions(projectId, regions),
    onSuccess: cache.setProject,
    onError: (error) => toast.error(error),
  });

  const detect = useMutation({
    mutationFn: () => projectService.detectRegions(projectId),
    onSuccess: cache.setProject,
    onError: (error) => toast.error(error),
  });

  return {
    saveRegions: save.mutate,
    isSavingRegions: save.isPending,

    detectRegions: detect.mutate,
    isDetectingRegions: detect.isPending,
  };
}
