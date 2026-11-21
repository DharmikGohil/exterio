import type { ScaleReference } from '@/domain/models/project';

const isPositive = (value: number | null): value is number =>
  value !== null && Number.isFinite(value) && value > 0;

/** Returns a plain-language reason the scale cannot be saved, or `null` when it is valid. */
export function describeScaleProblem(scale: ScaleReference): string | null {
  switch (scale.method) {
    case 'facade_dimensions':
      return isPositive(scale.facadeWidthFt) && isPositive(scale.facadeHeightFt)
        ? null
        : 'Enter both the width and the height of the wall in feet.';
    case 'reference_line':
      if (!scale.referenceLine) {
        return 'Place the two ends of the measurement on the photo.';
      }
      return isPositive(scale.referenceLengthFt)
        ? null
        : 'Enter the real length of the measurement in feet.';
    case 'door_height':
      return isPositive(scale.doorHeightFt) ? null : 'Enter the height of the door in feet.';
    case 'storey_height':
      return Number.isInteger(scale.storeys) && scale.storeys >= 1
        ? null
        : 'Enter how many floors the house has (1 or more).';
  }
}
