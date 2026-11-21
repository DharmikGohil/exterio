import { useState } from 'react';

import type { Design } from '@/domain/models/design';
import type { Project } from '@/domain/models/project';
import { useToast } from '@/presentation/shared/hooks/useToast';
import { getErrorMessage } from '@/presentation/shared/utils/errors';

import { useDesignActions } from './useDesignActions';

type DesignDialog =
  { kind: 'create' } | { kind: 'rename'; design: Design } | { kind: 'delete'; design: Design };

function suggestDesignName(designs: readonly Design[]): string {
  const taken = new Set(designs.map((design) => design.name.trim().toLowerCase()));
  let index = designs.length + 1;
  while (taken.has(`design ${index}`)) {
    index += 1;
  }
  return `Design ${index}`;
}

/** Dialog state and actions behind the design tabs (new, rename, duplicate, delete). */
export function useDesignManager(project: Project, onDesignSelected: (designId: string) => void) {
  const toast = useToast();
  const actions = useDesignActions(project.id);
  const [dialog, setDialog] = useState<DesignDialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const openDialog = (next: DesignDialog) => {
    setDialogError(null);
    setDialog(next);
  };
  const closeDialog = () => setDialog(null);

  const submitCreate = async (name: string) => {
    try {
      const design = await actions.createDesign({ name });
      closeDialog();
      onDesignSelected(design.id);
    } catch (error) {
      setDialogError(getErrorMessage(error));
    }
  };

  const submitRename = async (name: string) => {
    if (dialog?.kind !== 'rename') {
      return;
    }
    try {
      await actions.renameDesign({ designId: dialog.design.id, name });
      closeDialog();
    } catch (error) {
      setDialogError(getErrorMessage(error));
    }
  };

  const duplicate = async (design: Design) => {
    try {
      const copy = await actions.createDesign({
        name: `${design.name} copy`,
        copyFromDesignId: design.id,
      });
      onDesignSelected(copy.id);
      toast.success(`Created "${copy.name}". Change a few finishes to compare.`);
    } catch (error) {
      toast.error(error);
    }
  };

  const confirmDelete = async () => {
    if (dialog?.kind !== 'delete') {
      return;
    }
    const { design } = dialog;
    try {
      await actions.deleteDesign(design.id);
      closeDialog();
      const fallback = project.designs.find((item) => item.id !== design.id);
      if (fallback) {
        onDesignSelected(fallback.id);
      }
      toast.success(`"${design.name}" was deleted.`);
    } catch (error) {
      toast.error(error);
    }
  };

  return {
    dialog,
    dialogError,
    suggestedName: suggestDesignName(project.designs),
    canDelete: project.designs.length > 1,
    openCreate: () => openDialog({ kind: 'create' }),
    openRename: (design: Design) => openDialog({ kind: 'rename', design }),
    openDelete: (design: Design) => openDialog({ kind: 'delete', design }),
    closeDialog,
    submitCreate,
    submitRename,
    duplicate,
    confirmDelete,
    isCreating: actions.isCreating,
    isRenaming: actions.isRenaming,
    isDeleting: actions.isDeleting,
  };
}
