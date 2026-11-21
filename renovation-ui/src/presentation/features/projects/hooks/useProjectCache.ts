import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Design } from '@/domain/models/design';
import type { Project } from '@/domain/models/project';
import { ESTIMATE_QUERY_KEYS } from '@/presentation/features/estimate/hooks/estimateQueryKeys';

import { PROJECT_QUERY_KEYS } from './projectQueryKeys';

/**
 * Writes server responses into the React Query cache.
 * The project detail entry is the single source of truth for a project and its designs;
 * mutations put their response here instead of refetching.
 */
export function useProjectCache() {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const updateProject = (projectId: string, updater: (project: Project) => Project) => {
      queryClient.setQueryData<Project>(PROJECT_QUERY_KEYS.detail(projectId), (current) =>
        current ? updater(current) : current
      );
    };

    const invalidateLists = () =>
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });

    return {
      getProject: (projectId: string) =>
        queryClient.getQueryData<Project>(PROJECT_QUERY_KEYS.detail(projectId)),

      /** Stores a full project returned by the API. Anything that changes cost is refreshed. */
      setProject: (project: Project) => {
        queryClient.setQueryData(PROJECT_QUERY_KEYS.detail(project.id), project);
        void invalidateLists();
        void queryClient.invalidateQueries({ queryKey: ESTIMATE_QUERY_KEYS.all });
      },

      /** Changes the cached project in place without a server response (optimistic updates). */
      patchProject: updateProject,

      /** Adds or replaces one design inside its project. */
      upsertDesign: (design: Design) => {
        updateProject(design.projectId, (project) => {
          const exists = project.designs.some((item) => item.id === design.id);
          return {
            ...project,
            designs: exists
              ? project.designs.map((item) => (item.id === design.id ? design : item))
              : [...project.designs, design],
          };
        });
      },

      /** Changes one design in place without a server response (optimistic updates). */
      patchDesign: (projectId: string, designId: string, updater: (design: Design) => Design) => {
        updateProject(projectId, (project) => ({
          ...project,
          designs: project.designs.map((item) => (item.id === designId ? updater(item) : item)),
        }));
      },

      removeDesign: (projectId: string, designId: string) => {
        updateProject(projectId, (project) => ({
          ...project,
          designs: project.designs.filter((item) => item.id !== designId),
        }));
        queryClient.removeQueries({ queryKey: ESTIMATE_QUERY_KEYS.detail(designId) });
      },

      removeProject: (projectId: string) => {
        queryClient.removeQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) });
        void invalidateLists();
      },

      invalidateProject: (projectId: string) =>
        queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) }),

      invalidateLists,

      invalidateEstimate: (designId: string) =>
        queryClient.invalidateQueries({ queryKey: ESTIMATE_QUERY_KEYS.detail(designId) }),
    };
  }, [queryClient]);
}
