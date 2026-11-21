import { useQuery } from '@tanstack/react-query';

import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';

import { PROJECT_QUERY_KEYS } from './projectQueryKeys';

/** The signed-in user's projects, newest first as returned by the API. */
export function useProjects() {
  const { projectService } = useProjectContext();

  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: PROJECT_QUERY_KEYS.lists(),
    queryFn: () => projectService.listProjects(),
  });

  return { projects, isLoading, error, refetch };
}
