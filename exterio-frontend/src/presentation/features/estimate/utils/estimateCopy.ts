import { formatNumber } from '@/presentation/shared/utils/format';
import type { PartGroup } from '@/presentation/features/estimate/utils/partGroups';
import type { EstimateLine, EstimateRegion } from '@/domain/models/estimate';
import type { RegionLabel, ScaleReference } from '@/domain/models/project';

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

/** Which parts are not counted yet, as one sentence, or null when every part is priced. */
export function describeLeftOut(groups: readonly PartGroup[]): string | null {
  const left = groups.filter((group) => group.isUnpriced).map((group) => lowerFirst(group.title));
  if (left.length === 0) {
    return null;
  }
  const isOne = left.length === 1 && !/s$/.test(left[0]);
  return `${capitalise(joinWithAnd(left))} ${isOne ? 'has' : 'have'} no finish yet, so ${isOne ? 'it is' : 'they are'} not counted.`;
}

/** The note under the diagram: which parts are not counted yet, and what no estimate includes. */
export function describeExclusions(groups: readonly PartGroup[]): string {
  const leftOut = describeLeftOut(groups);
  return leftOut ? `${leftOut} ${NOT_INCLUDED}` : NOT_INCLUDED;
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

const LIST_NUMBER_WORDS = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
];

/** Where a material goes, in words: "Roof edge, gate and balcony slab", "Two pillars". */
export function describeUses(
  materialId: string,
  rows: readonly EstimateRegion[],
  labelOrder: readonly RegionLabel[],
  pluralOf: (label: RegionLabel) => string
): string {
  const uses = labelOrder.flatMap((label) => {
    const members = rows.filter((row) => row.materialId === materialId && row.label === label);
    if (members.length === 0) {
      return [];
    }
    if (members.length === 1) {
      return [members[0].name];
    }
    const count = LIST_NUMBER_WORDS[members.length] ?? String(members.length);
    return [`${count} ${pluralOf(label).toLowerCase()}`];
  });
  const [first = '', ...rest] = uses;
  return capitalise(joinWithAnd([first, ...rest.map(lowerFirst)]));
}

/** "91 sq ft plus 5% extra for waste": the exact need and the allowance on top. */
export function describeWaste(
  line: Pick<EstimateLine, 'netQuantity' | 'wastagePct' | 'unit'>
): string {
  const unit = line.unit === 'rft' ? 'running ft' : 'sq ft';
  const net = `${formatNumber(line.netQuantity, 0)} ${unit}`;
  return line.wastagePct > 0
    ? `${net} plus ${formatNumber(line.wastagePct)}% extra for waste`
    : net;
}

/** The short notes beside the breakdown: what the numbers rest on and what they leave out. */
export function goodToKnow(
  scale: ScaleReference | null,
  confidencePct: number,
  hasRoof: boolean
): string[] {
  const basis = scale
    ? `Sizes come from ${describeScaleBasis(scale).replace(/^a /, 'the ')} you entered, so the total could be about ${formatNumber(confidencePct)}% higher or lower.`
    : `No size was set, so sizes are a rough guess and the total could be about ${formatNumber(confidencePct)}% higher or lower.`;
  return [
    basis,
    'Only what shows in the photo is counted, not the sides you cannot see.',
    ...(hasRoof
      ? [
          'A sloped roof is larger than it looks from the front. Type its real area under Part sizes if you know it.',
        ]
      : []),
    'We add extra material for waste. Labour is charged on the exact area.',
    'Not included: GST, scaffolding, wall repair and transport.',
  ];
}
