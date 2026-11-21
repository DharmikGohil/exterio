import { useMutation } from '@tanstack/react-query';

import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';
import { useToast } from '@/presentation/shared/hooks/useToast';

import { useProjectCache } from './useProjectCache';

export function useRenameProject(projectId: string) {
  const { projectService } = useProjectContext();
  const cache = useProjectCache();
  const toast = useToast();

  const { mutate: renameProject, isPending: isRenaming } = useMutation({
    mutationFn: (name: string) => projectService.renameProject(projectId, name),
    onSuccess: cache.setProject,
    onError: (error) => toast.error(error),
  });

  return { renameProject, isRenaming };
}
