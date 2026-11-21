import { Button } from '@/presentation/shared/atoms/Button';
import { ConfirmDialog } from '@/presentation/shared/molecules/ConfirmDialog';
import { NameDialog } from '@/presentation/shared/molecules/NameDialog';
import { useProjectListPage } from '@/presentation/features/projects/hooks/useProjectListPage';
import { ProjectGrid } from '@/presentation/features/projects/organisms/ProjectGrid';

export function ProjectListPage() {
  const page = useProjectListPage();
  const hasProjects = page.projects.length > 0;

  return (
    <div className="w-full space-y-9 pb-9 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[34px] font-medium leading-tight tracking-[-0.01em] text-stone-900">
            Projects
          </h1>
          <p className="text-[15px] text-stone-600">
            One project per house, each with as many design options as you want to compare
          </p>
        </div>
        {hasProjects && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              isLoading={page.isCreatingSample}
              onClick={page.createSampleProject}
            >
              Open a sample house
            </Button>
            <Button icon="plus" onClick={page.openCreateDialog}>
              New project
            </Button>
          </div>
        )}
      </div>

      <ProjectGrid
        projects={page.projects}
        isLoading={page.isLoading}
        error={page.error}
        onRetry={page.refetch}
        onRename={page.requestRename}
        onDelete={page.requestDelete}
        onCreate={page.openCreateDialog}
        onCreateSample={page.createSampleProject}
        isCreatingSample={page.isCreatingSample}
      />

      <NameDialog
        open={page.isCreateDialogOpen}
        title="New project"
        description="Give it a name you will recognise, like the address or the owner's name."
        fieldLabel="Project name"
        placeholder="e.g. Patel residence, Vadodara"
        submitLabel="Create project"
        isSubmitting={page.isCreating}
        error={page.createErrorMessage}
        onSubmit={page.createProject}
        onClose={page.closeCreateDialog}
      />

      <NameDialog
        open={page.projectToRename !== null}
        title="Rename project"
        fieldLabel="Project name"
        initialValue={page.projectToRename?.name ?? ''}
        submitLabel="Save name"
        isSubmitting={page.isRenaming}
        error={page.renameErrorMessage}
        onSubmit={page.renameProject}
        onClose={page.cancelRename}
      />

      <ConfirmDialog
        open={page.projectToDelete !== null}
        title="Delete this project?"
        description={`"${page.projectToDelete?.name ?? ''}" and all of its designs and estimates will be permanently deleted.`}
        confirmLabel="Delete project"
        tone="danger"
        isConfirming={page.isDeleting}
        onConfirm={page.confirmDelete}
        onCancel={page.cancelDelete}
      />
    </div>
  );
}
