import { Button } from '@/presentation/shared/atoms/Button';
import { ConfirmDialog } from '@/presentation/shared/molecules/ConfirmDialog';
import { NameDialog } from '@/presentation/shared/molecules/NameDialog';
import { useProjectListPage } from '@/presentation/features/projects/hooks/useProjectListPage';
import { ProjectToolbar } from '@/presentation/features/projects/molecules/ProjectToolbar';
import { ProjectGrid } from '@/presentation/features/projects/organisms/ProjectGrid';

export function ProjectListPage() {
  const page = useProjectListPage();

  return (
    <div className="w-full space-y-7 pb-9 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[34px] font-medium leading-tight tracking-[-0.01em] text-stone-900">
            Your houses
          </h1>
          <p className="text-[15px] text-stone-600">
            One project per house, with as many designs as you want to compare.
          </p>
        </div>
        <Button icon="plus" size="lg" onClick={page.openCreateDialog}>
          New project
        </Button>
      </div>

      {page.hasProjects && (
        <ProjectToolbar
          query={page.query}
          onQueryChange={page.setQuery}
          sort={page.sort}
          onSortChange={page.setSort}
        />
      )}

      <ProjectGrid
        projects={page.projects}
        query={page.query}
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
        description="One project per house. Give it a name you will recognise, like the address or the owner's name."
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
        title="Delete this house?"
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
