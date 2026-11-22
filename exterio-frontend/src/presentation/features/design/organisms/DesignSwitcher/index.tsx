import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { ConfirmDialog } from '@/presentation/shared/molecules/ConfirmDialog';
import { DropdownMenu } from '@/presentation/shared/molecules/DropdownMenu';
import { NameDialog } from '@/presentation/shared/molecules/NameDialog';
import { useDesignManager } from '@/presentation/features/design/hooks/useDesignManager';
import type { Design } from '@/domain/models/design';
import type { Project } from '@/domain/models/project';

export interface DesignSwitcherProps {
  project: Project;
  activeDesign: Design;
  onSelect: (designId: string) => void;
}

/**
 * Which design is being edited: a dropdown of the project's designs, a "more" menu to rename,
 * duplicate or delete the current one, and a button to start a new one.
 */
export function DesignSwitcher({ project, activeDesign, onSelect }: DesignSwitcherProps) {
  const manager = useDesignManager(project, onSelect);
  const { dialog } = manager;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <DropdownMenu
        label="Designs"
        triggerClassName="flex h-11 max-w-[min(22rem,70vw)] items-center gap-2 rounded-xl bg-stone-900 px-5 text-[15px] font-medium text-white transition-colors hover:bg-stone-800"
        trigger={
          <>
            <span className="shrink-0 font-normal text-white/60">Design:</span>
            <span className="truncate">{activeDesign.name}</span>
            <Icon name="chevron-down" className="h-4 w-4 shrink-0" />
          </>
        }
        items={project.designs.map((design) => ({
          key: design.id,
          label: design.name,
          checked: design.id === activeDesign.id,
          onSelect: () => onSelect(design.id),
        }))}
      />
      <DropdownMenu
        label={`Actions for ${activeDesign.name}`}
        triggerLabel={`More actions for ${activeDesign.name}`}
        triggerClassName="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50"
        trigger={<Icon name="more" className="h-5 w-5" />}
        items={[
          {
            key: 'rename',
            label: 'Rename',
            icon: 'edit',
            onSelect: () => manager.openRename(activeDesign),
          },
          {
            key: 'duplicate',
            label: 'Duplicate to try a variation',
            icon: 'copy',
            disabled: manager.isCreating,
            onSelect: () => manager.duplicate(activeDesign),
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: 'trash',
            tone: 'danger',
            disabled: !manager.canDelete,
            title: manager.canDelete ? undefined : 'A project needs at least one design',
            onSelect: () => manager.openDelete(activeDesign),
          },
        ]}
      />
      <Button variant="outline" size="lg" icon="plus" onClick={manager.openCreate}>
        New design
      </Button>

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
