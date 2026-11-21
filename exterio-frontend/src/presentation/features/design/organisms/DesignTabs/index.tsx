import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Tooltip } from '@/presentation/shared/atoms/Tooltip';
import { ConfirmDialog } from '@/presentation/shared/molecules/ConfirmDialog';
import { NameDialog } from '@/presentation/shared/molecules/NameDialog';
import { cn } from '@/presentation/shared/utils/cn';
import { useDesignManager } from '@/presentation/features/design/hooks/useDesignManager';
import type { Design } from '@/domain/models/design';
import type { Project } from '@/domain/models/project';

export interface DesignTabsProps {
  project: Project;
  activeDesign: Design;
  onSelect: (designId: string) => void;
}

/** One tab per design option, plus new / rename / duplicate / delete for the active one. */
export function DesignTabs({ project, activeDesign, onSelect }: DesignTabsProps) {
  const manager = useDesignManager(project, onSelect);
  const { dialog } = manager;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-stone-200 pb-3">
      <div
        role="tablist"
        aria-label="Design options"
        className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto px-1 py-1"
      >
        {project.designs.map((design) => {
          const isActive = design.id === activeDesign.id;
          return (
            <button
              key={design.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(design.id)}
              className={cn(
                'max-w-[12rem] shrink-0 truncate rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                isActive
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              )}
            >
              {design.name}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1">
        <Tooltip content="Rename this design">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Rename ${activeDesign.name}`}
            onClick={() => manager.openRename(activeDesign)}
          >
            <Icon name="edit" />
          </Button>
        </Tooltip>
        <Tooltip content="Duplicate to try a variation">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Duplicate ${activeDesign.name}`}
            disabled={manager.isCreating}
            onClick={() => manager.duplicate(activeDesign)}
          >
            <Icon name="copy" />
          </Button>
        </Tooltip>
        <Tooltip
          content={manager.canDelete ? 'Delete this design' : 'A project needs at least one design'}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${activeDesign.name}`}
            disabled={!manager.canDelete}
            onClick={() => manager.openDelete(activeDesign)}
          >
            <Icon name="trash" />
          </Button>
        </Tooltip>
        <Button
          variant="outline"
          size="sm"
          icon="plus"
          className="ml-1"
          onClick={manager.openCreate}
        >
          New design
        </Button>
      </div>

      <NameDialog
        open={dialog?.kind === 'create'}
        title="New design"
        description="A design is one combination of finishes. Create a few and compare their look and cost."
        fieldLabel="Design name"
        initialValue={manager.suggestedName}
        submitLabel="Create design"
        isSubmitting={manager.isCreating}
        error={manager.dialogError}
        onSubmit={manager.submitCreate}
        onClose={manager.closeDialog}
      />

      <NameDialog
        open={dialog?.kind === 'rename'}
        title="Rename design"
        fieldLabel="Design name"
        initialValue={dialog?.kind === 'rename' ? dialog.design.name : ''}
        submitLabel="Save name"
        isSubmitting={manager.isRenaming}
        error={manager.dialogError}
        onSubmit={manager.submitRename}
        onClose={manager.closeDialog}
      />

      <ConfirmDialog
        open={dialog?.kind === 'delete'}
        title="Delete this design?"
        description={`"${dialog?.kind === 'delete' ? dialog.design.name : ''}" and its finishes will be permanently deleted. The photo and regions are not affected.`}
        confirmLabel="Delete design"
        tone="danger"
        isConfirming={manager.isDeleting}
        onConfirm={manager.confirmDelete}
        onCancel={manager.closeDialog}
      />
    </div>
  );
}
