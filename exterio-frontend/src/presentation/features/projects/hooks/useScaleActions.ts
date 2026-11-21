import { useMutation } from '@tanstack/react-query';

import type { ScaleReference } from '@/domain/models/project';
import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';
import { useToast } from '@/presentation/shared/hooks/useToast';

import { useProjectCache } from './useProjectCache';

export function useScaleActions(projectId: string) {
  const { projectService } = useProjectContext();
  const cache = useProjectCache();
  const toast = useToast();

  const { mutate: saveScale, isPending: isSavingScale } = useMutation({
    mutationFn: (scale: ScaleReference) => projectService.saveScale(projectId, scale),
    // Saved automatically as the user types, so success is shown inline, not as a toast.
    onSuccess: cache.setProject,
    onError: (error) => toast.error(error),
  });

  return { saveScale, isSavingScale };
}
