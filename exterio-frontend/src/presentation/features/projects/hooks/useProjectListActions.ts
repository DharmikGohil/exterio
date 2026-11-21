import { useMutation } from '@tanstack/react-query';

import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';

import { useProjectCache } from './useProjectCache';

/** Create, create-from-sample and delete, for the project list page. */
export function useProjectListActions() {
  const { projectService } = useProjectContext();
  const cache = useProjectCache();

  const create = useMutation({
    mutationFn: (name: string) => projectService.createProject(name),
    onSuccess: cache.setProject,
  });

  const createSample = useMutation({
    mutationFn: () => projectService.createSampleProject(),
    onSuccess: cache.setProject,
  });

  const remove = useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: (_result, projectId) => cache.removeProject(projectId),
  });

  return {
    createProject: create.mutateAsync,
    isCreating: create.isPending,
    createError: create.error,
    resetCreateState: create.reset,

    createSampleProject: createSample.mutateAsync,
    isCreatingSample: createSample.isPending,

    deleteProject: remove.mutateAsync,
    isDeleting: remove.isPending,
  };
}
