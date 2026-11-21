import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { ProjectService } from '@/application/features/project/ProjectService';
import type { IProjectService } from '@/domain/interfaces/project';
import { ProjectRepository } from '@/infrastructure/api/project/ProjectRepository';
import { useHttpClientContext } from '@/presentation/shared/contexts/HttpClientContext';

interface ProjectContextType {
  projectService: IProjectService;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

/** Composition root for the project feature: repository -> service, shared via context. */
export function ProjectProvider({ children }: ProjectProviderProps) {
  const { httpClient } = useHttpClientContext();

  const services = useMemo(() => {
    const projectRepository = new ProjectRepository(httpClient);
    const projectService = new ProjectService(projectRepository);
    return { projectService };
  }, [httpClient]);

  return <ProjectContext.Provider value={services}>{children}</ProjectContext.Provider>;
}

export function useProjectContext(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}
