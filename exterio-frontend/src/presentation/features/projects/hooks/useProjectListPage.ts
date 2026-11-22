import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ProjectSummary } from '@/domain/models/project';
import { ROUTES } from '@/presentation/routes/paths';
import { useDisclosure } from '@/presentation/shared/hooks/useDisclosure';
import { useToast } from '@/presentation/shared/hooks/useToast';
import { getErrorMessage } from '@/presentation/shared/utils/errors';

import {
  filterAndSortProjects,
  type ProjectSort,
} from '@/presentation/features/projects/utils/projectList';

import { useProjectListActions } from './useProjectListActions';
import { useProjects } from './useProjects';

/** Everything the project list page needs: data, dialogs and the actions behind its buttons. */
export function useProjectListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { projects, isLoading, error, refetch } = useProjects();
  const actions = useProjectListActions();
  const createDialog = useDisclosure();
  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null);
  const [projectToRename, setProjectToRename] = useState<ProjectSummary | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ProjectSort>('recent');
  const visibleProjects = useMemo(
    () => filterAndSortProjects(projects, query, sort),
    [projects, query, sort]
  );

  const openCreateDialog = () => {
    actions.resetCreateState();
    createDialog.open();
  };

  const createProject = async (name: string) => {
    try {
      const project = await actions.createProject(name);
      createDialog.close();
      navigate(ROUTES.project(project.id));
    } catch {
      // Shown inline in the dialog through `createErrorMessage`.
    }
  };

  const createSampleProject = async () => {
    try {
      const project = await actions.createSampleProject();
      // Samples are created at different stages; each opens at its own next step.
      navigate(ROUTES.project(project.id));
    } catch (sampleError) {
      toast.error(sampleError);
    }
  };

  const requestRename = (project: ProjectSummary) => {
    actions.resetRenameState();
    setProjectToRename(project);
  };

  const renameProject = async (name: string) => {
    if (!projectToRename) {
      return;
    }
    try {
      await actions.renameProject({ projectId: projectToRename.id, name });
      setProjectToRename(null);
    } catch {
      // Shown inline in the dialog through `renameErrorMessage`.
    }
  };

  const confirmDelete = async () => {
    if (!projectToDelete) {
      return;
    }
    try {
      await actions.deleteProject(projectToDelete.id);
      toast.success(`"${projectToDelete.name}" was deleted.`);
      setProjectToDelete(null);
    } catch (deleteError) {
      toast.error(deleteError);
    }
  };

  return {
    projects: visibleProjects,
    hasProjects: projects.length > 0,
    query,
    setQuery,
    sort,
    setSort,
    isLoading,
    error,
    refetch,

    isCreateDialogOpen: createDialog.isOpen,
    openCreateDialog,
    closeCreateDialog: createDialog.close,
    createProject,
    isCreating: actions.isCreating,
    createErrorMessage: actions.createError ? getErrorMessage(actions.createError) : null,

    createSampleProject,
    isCreatingSample: actions.isCreatingSample,

    projectToRename,
    requestRename,
    cancelRename: () => setProjectToRename(null),
    renameProject,
    isRenaming: actions.isRenaming,
    renameErrorMessage: actions.renameError ? getErrorMessage(actions.renameError) : null,

    projectToDelete,
    requestDelete: setProjectToDelete,
    cancelDelete: () => setProjectToDelete(null),
    confirmDelete,
    isDeleting: actions.isDeleting,
  };
}
