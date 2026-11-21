import { useState, type FormEvent } from 'react';

import { Button } from '@/presentation/shared/atoms/Button';
import { Dialog } from '@/presentation/shared/atoms/Dialog';
import { Input } from '@/presentation/shared/atoms/Input';
import { Select } from '@/presentation/shared/atoms/Select';
import { FormField } from '@/presentation/shared/molecules/FormField';
import { suggestRegionName } from '@/presentation/features/studio/utils/regionDraft';
import { REGION_LABEL_OPTIONS, isRegionLabel } from '@/presentation/shared/utils/regionLabels';
import type { Region, RegionLabel } from '@/domain/models/project';

const FORM_ID = 'region-label-form';

export interface RegionLabelDialogProps {
  open: boolean;
  /** Existing regions, used to suggest a name such as "Wall 3". */
  regions: readonly Region[];
  onConfirm: (label: RegionLabel, name: string) => void;
  onCancel: () => void;
}

type RegionLabelFormProps = Pick<RegionLabelDialogProps, 'regions' | 'onConfirm'>;

function RegionLabelForm({ regions, onConfirm }: RegionLabelFormProps) {
  const [label, setLabel] = useState<RegionLabel>('wall');
  // `null` means "use the suggestion for the chosen type".
  const [customName, setCustomName] = useState<string | null>(null);
  const name = customName ?? suggestRegionName(label, regions);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim()) {
      onConfirm(label, name.trim());
    }
  };

  return (
    <form id={FORM_ID} className="space-y-4" onSubmit={handleSubmit}>
      <FormField label="Type" htmlFor="new-region-label">
        <Select
          id="new-region-label"
          autoFocus
          options={REGION_LABEL_OPTIONS}
          value={label}
          onChange={(event) => {
            if (isRegionLabel(event.target.value)) {
              setLabel(event.target.value);
            }
          }}
        />
      </FormField>
      <FormField label="Name" htmlFor="new-region-name">
        <Input
          id="new-region-name"
          required
          maxLength={60}
          value={name}
          onChange={(event) => setCustomName(event.target.value)}
        />
      </FormField>
    </form>
  );
}

/** Asked right after a shape is drawn: what part of the house is it? */
export function RegionLabelDialog({ open, regions, onConfirm, onCancel }: RegionLabelDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="What did you just mark?"
      description="The type decides which finishes can be applied to this part."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Discard shape
          </Button>
          <Button type="submit" form={FORM_ID}>
            Add region
          </Button>
        </>
      }
    >
      <RegionLabelForm regions={regions} onConfirm={onConfirm} />
    </Dialog>
  );
}
