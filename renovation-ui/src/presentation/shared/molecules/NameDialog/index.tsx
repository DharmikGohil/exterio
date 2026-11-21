import { useId, useState, type FormEvent } from 'react';

import { Button } from '@/presentation/shared/atoms/Button';
import { Dialog } from '@/presentation/shared/atoms/Dialog';
import { Input } from '@/presentation/shared/atoms/Input';
import { FormField } from '@/presentation/shared/molecules/FormField';

export interface NameDialogProps {
  open: boolean;
  title: string;
  description?: string;
  fieldLabel: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel: string;
  isSubmitting?: boolean;
  /** Error from the last submit attempt. */
  error?: string | null;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

interface NameFormProps extends Omit<NameDialogProps, 'open' | 'title' | 'description'> {
  formId: string;
}

function NameForm({
  formId,
  fieldLabel,
  placeholder,
  initialValue = '',
  error,
  onSubmit,
}: NameFormProps) {
  const inputId = useId();
  const [name, setName] = useState(initialValue);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <FormField label={fieldLabel} htmlFor={inputId} error={error}>
        <Input
          id={inputId}
          autoFocus
          required
          maxLength={80}
          placeholder={placeholder}
          value={name}
          invalid={Boolean(error)}
          onChange={(event) => setName(event.target.value)}
          onFocus={(event) => event.target.select()}
        />
      </FormField>
    </form>
  );
}

/** Asks for a single name (new project, new design, rename...). */
export function NameDialog({ open, title, description, onClose, ...formProps }: NameDialogProps) {
  const formId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={formProps.isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} isLoading={formProps.isSubmitting}>
            {formProps.submitLabel}
          </Button>
        </>
      }
    >
      {/* Mounted only while open, so the field starts from `initialValue` every time. */}
      <NameForm formId={formId} onClose={onClose} {...formProps} />
    </Dialog>
  );
}
