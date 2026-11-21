import { ConfirmDialog } from '@/presentation/shared/molecules/ConfirmDialog';

export interface UnsavedChangesDialogProps {
  open: boolean;
  /** What would be lost, e.g. "Your region edits". */
  subject: string;
  onStay: () => void;
  onLeave: () => void;
}

export function UnsavedChangesDialog({
  open,
  subject,
  onStay,
  onLeave,
}: UnsavedChangesDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Leave without saving?"
      description={`${subject} have not been saved yet. If you leave now they will be lost.`}
      confirmLabel="Leave without saving"
      cancelLabel="Keep editing"
      tone="danger"
      onConfirm={onLeave}
      onCancel={onStay}
    />
  );
}
