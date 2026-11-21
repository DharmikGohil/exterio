import { useQuery } from '@tanstack/react-query';

import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';

import { PROJECT_QUERY_KEYS } from './projectQueryKeys';

/** One project with its photo, regions, scale and designs. */
export function useProject(projectId: string | undefined) {
  const { projectService } = useProjectContext();

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: PROJECT_QUERY_KEYS.detail(projectId ?? ''),
    queryFn: () => projectService.getProject(projectId ?? ''),
    enabled: Boolean(projectId),
  });

  return { project, isLoading, error, refetch };
}
