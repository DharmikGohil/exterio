import { formatNumber } from '@/presentation/shared/utils/format';
import type { PartGroup } from '@/presentation/features/estimate/utils/partGroups';
import type { ScaleReference } from '@/domain/models/project';

/** What the estimate's sizes rest on, completing "Based on …". */
export function describeScaleBasis(scale: ScaleReference | null): string {
  if (!scale) {
    return 'a rough guess';
  }
  switch (scale.method) {
    case 'facade_dimensions':
      return scale.facadeWidthFt && scale.facadeHeightFt
        ? `a wall of ${formatNumber(scale.facadeWidthFt)} × ${formatNumber(scale.facadeHeightFt)} ft`
        : 'the wall size';
    case 'reference_line':
      return scale.referenceLengthFt
        ? `one length of ${formatNumber(scale.referenceLengthFt)} ft`
        : 'one known length';
    case 'door_height':
      return `a door ${formatNumber(scale.doorHeightFt)} ft tall`;
    case 'storey_height':
      return scale.storeys === 1 ? 'one floor' : `${scale.storeys} floors`;
  }
}

const NOT_INCLUDED =
  'GST, scaffolding, wall repair and transport are not included. This is a guide, not a quotation.';

/** The note under the diagram: which parts are not counted yet, and what no estimate includes. */
export function describeExclusions(groups: readonly PartGroup[]): string {
  const left = groups.filter((group) => group.isUnpriced).map((group) => lowerFirst(group.title));
  if (left.length === 0) {
    return NOT_INCLUDED;
  }
  const verb = left.length === 1 && !/s$/.test(left[0]) ? 'has' : 'have';
  const them = left.length === 1 && !/s$/.test(left[0]) ? 'it is' : 'they are';
  return `${capitalise(joinWithAnd(left))} ${verb} no finish yet, so ${them} not counted. ${NOT_INCLUDED}`;
}

function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) {
    return items[0] ?? '';
  }
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
