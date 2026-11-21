import { Alert } from '@/presentation/shared/atoms/Alert';
import { NumberField } from '@/presentation/shared/molecules/NumberField';
import type { ScaleFieldPatch } from '@/presentation/features/studio/hooks/useScaleStep';
import type { ScaleReference } from '@/domain/models/project';

export interface ScaleMethodFormProps {
  scale: ScaleReference;
  hasDoorRegion: boolean;
  onChange: (patch: ScaleFieldPatch) => void;
}

/** The inputs that belong to the chosen scale method. */
export function ScaleMethodForm({ scale, hasDoorRegion, onChange }: ScaleMethodFormProps) {
  switch (scale.method) {
    case 'facade_dimensions':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Width (ft)"
              placeholder="e.g. 30"
              value={scale.facadeWidthFt}
              onChange={(value) => onChange({ facadeWidthFt: value })}
            />
            <NumberField
              label="Height (ft)"
              placeholder="e.g. 22"
              value={scale.facadeHeightFt}
              onChange={(value) => onChange({ facadeHeightFt: value })}
            />
          </div>
        </div>
      );

    case 'reference_line':
      return (
        <div className="space-y-3">
          <NumberField
            label="Length from A to B (ft)"
            placeholder="e.g. 10"
            value={scale.referenceLengthFt}
            onChange={(value) => onChange({ referenceLengthFt: value })}
          />
        </div>
      );

    case 'door_height':
      return (
        <div className="space-y-3">
          {!hasDoorRegion && (
            <Alert tone="warning" title="No door is marked yet">
              This option measures the door region from the Regions step. Mark the main door there
              first, or pick another option.
            </Alert>
          )}
          <NumberField
            label="Door height (ft)"
            value={scale.doorHeightFt}
            onChange={(value) => onChange({ doorHeightFt: value ?? 0 })}
          />
        </div>
      );

    case 'storey_height':
      return (
        <NumberField
          label="Number of floors in the photo"
          min={1}
          max={20}
          step={1}
          value={scale.storeys}
          hint="The ground floor counts as 1."
          onChange={(value) => onChange({ storeys: value ?? 0 })}
        />
      );
  }
}
