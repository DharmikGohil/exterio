import { Alert } from '@/presentation/shared/atoms/Alert';
import { NumberField } from '@/presentation/shared/molecules/NumberField';
import type { ScaleFieldPatch } from '@/presentation/features/studio/hooks/useScaleStep';
import { FEET_PER_STOREY } from '@/presentation/features/studio/utils/scaleDefaults';
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
              label="Wall width"
              suffix="ft"
              placeholder="e.g. 30"
              value={scale.facadeWidthFt}
              onChange={(value) => onChange({ facadeWidthFt: value })}
            />
            <NumberField
              label="Wall height"
              suffix="ft"
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
          <p className="text-sm leading-relaxed text-stone-600">
            Drag the blue points A and B on the photo onto the two ends of it.
          </p>
          <NumberField
            label="Real length from A to B"
            suffix="ft"
            placeholder="e.g. 10"
            value={scale.referenceLengthFt}
            onChange={(value) => onChange({ referenceLengthFt: value })}
          />
        </div>
      );

    case 'door_height':
      return (
        <div className="space-y-3">
          {hasDoorRegion ? (
            <p className="text-sm leading-relaxed text-stone-600">
              The door you marked is highlighted on the photo. Change the height only if your door
              is unusually tall or short.
            </p>
          ) : (
            <Alert tone="warning" title="No door is marked yet">
              This option measures the door region from the Regions step. Mark the main door there
              first, or pick another option.
            </Alert>
          )}
          <NumberField
            label="Door height"
            suffix="ft"
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
          hint={`Ground floor counts as 1. We assume about ${FEET_PER_STOREY} ft per floor, measured over the wall outlined on the photo.`}
          onChange={(value) => onChange({ storeys: value ?? 0 })}
        />
      );
  }
}
