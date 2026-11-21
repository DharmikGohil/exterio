import { formatNumber } from '@/presentation/shared/utils/format';
import { getBounds, getPolygonArea } from '@/presentation/shared/utils/geometry';
import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';
import type { EstimateRegion } from '@/domain/models/estimate';
import { REGION_LABELS, type Region, type RegionLabel } from '@/domain/models/project';

const NUMBER_WORDS = [
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
  'ten',
];

/** Parts whose length matters as much as their area (they are priced or read by the foot). */
const LINEAR_LABELS: ReadonlySet<RegionLabel> = new Set([
  'parapet',
  'roof_edge',
  'railing',
  'gate',
  'fence',
]);
const OPENING_LABELS: ReadonlySet<RegionLabel> = new Set(['window', 'door']);

export type PartSide = 'left' | 'right';

interface Anchor {
  x: number;
  y: number;
}

/** Parts smaller than this share of their group's largest are never pointed at. */
const MIN_ANCHOR_SHARE = 0.3;

export interface PartGroup {
  /** Unique per card: the kind of part, or `other:<name>` for parts the detector named. */
  key: string;
  label: RegionLabel;
  /** "Front wall" for one part, "Two pillars" for several. */
  title: string;
  color: string;
  /** One line per finish used, plus a note for parts in the group without one. */
  finishLines: string[];
  /** Area and, where it matters, length. */
  measure: string;
  totalCost: number;
  /** No part in the group has a finish: it is not in the estimate at all. */
  isUnpriced: boolean;
  /** Where the leader line lands on the photo, as fractions of its width and height. */
  anchor: { x: number; y: number };
  side: PartSide;
}

/**
 * Turns the estimate's per-part rows into one card per kind of part, for the estimate diagram.
 *
 * Each card is put on the side of the photo its anchor is on, the sides are balanced to within
 * one card, and each side is ordered top to bottom, so leader lines rarely cross.
 */
export function buildPartGroups(
  rows: readonly EstimateRegion[],
  regions: readonly Region[],
  image: { width: number; height: number }
): PartGroup[] {
  const regionsById = new Map(regions.map((region) => [region.id, region]));
  const hasOpenings = rows.some((row) => OPENING_LABELS.has(row.label));

  const groups = bucketsByKind(rows).map(({ key, label, members }) => {
    const meta = REGION_LABEL_META[label];
    const finishes = [
      ...new Set(members.flatMap((row) => (row.materialName ? [row.materialName] : []))),
    ];
    const unfinished = members.filter((row) => !row.materialName).length;
    const isUnpriced = finishes.length === 0;
    const area = members.reduce((sum, row) => sum + row.areaSqft, 0);
    const length = members.reduce((sum, row) => sum + row.lengthFt, 0);

    const finishLines = isUnpriced
      ? ['No finish chosen yet']
      : [
          ...finishes,
          ...(unfinished > 0 ? [`${capitalise(countWord(unfinished))} without a finish yet`] : []),
        ];

    return {
      key,
      label,
      title: groupTitle(label, members, meta.plural),
      color: meta.color,
      finishLines,
      measure: describeMeasure(label, area, length, members.length, hasOpenings),
      totalCost: members.reduce((sum, row) => sum + row.totalCost, 0),
      isUnpriced,
      anchor: { x: 0.5, y: 0.5 },
      side: 'left' as PartSide,
      candidates: anchorCandidates(members, regionsById, image),
    };
  });

  return assignSides(groups);
}

interface KindBucket {
  key: string;
  label: RegionLabel;
  members: EstimateRegion[];
}

/**
 * Parts sorted into cards: one per kind, in list order, except `other` parts, which get a card
 * per name the detector gave them ("Solar panels" and "Water tank" are different things).
 */
function bucketsByKind(rows: readonly EstimateRegion[]): KindBucket[] {
  return REGION_LABELS.flatMap((label): KindBucket[] => {
    const members = rows.filter((row) => row.label === label);
    if (members.length === 0) {
      return [];
    }
    if (label !== 'other') {
      return [{ key: label, label, members }];
    }
    const byName = new Map<string, EstimateRegion[]>();
    for (const row of members) {
      const name = row.name.trim().toLowerCase() || 'other';
      byName.set(name, [...(byName.get(name) ?? []), row]);
    }
    return [...byName.entries()].map(([name, named]) => ({
      key: `other:${name}`,
      label,
      members: named,
    }));
  });
}

/** "Front wall" for one part, "Two pillars" for several; named parts keep their name. */
function groupTitle(
  label: RegionLabel,
  members: readonly EstimateRegion[],
  plural: string
): string {
  if (members.length === 1) {
    return members[0].name;
  }
  if (label === 'other') {
    return `${members[0].name.trim()} (${members.length})`;
  }
  return `${capitalise(countWord(members.length))} ${plural.toLowerCase()}`;
}

function describeMeasure(
  label: RegionLabel,
  area: number,
  length: number,
  count: number,
  hasOpenings: boolean
): string {
  const areaText = `${formatNumber(area, 0)} sq ft${count > 1 && OPENING_LABELS.has(label) ? ' in total' : ''}`;
  if (label === 'wall' && hasOpenings) {
    return `${areaText}, windows and doors left out`;
  }
  if (LINEAR_LABELS.has(label) && length > 0) {
    return `${areaText} · ${formatNumber(length, 0)} ft ${label === 'gate' ? 'wide' : 'long'}`;
  }
  return areaText;
}

/**
 * Where a group's line could land: the middle of each of its parts that is big enough to find,
 * largest first, as fractions of the photo.
 */
function anchorCandidates(
  members: readonly EstimateRegion[],
  regionsById: ReadonlyMap<string, Region>,
  image: { width: number; height: number }
): Anchor[] {
  if (image.width <= 0 || image.height <= 0) {
    return [{ x: 0.5, y: 0.5 }];
  }
  const parts = members
    .flatMap((row) => {
      const region = regionsById.get(row.regionId);
      const bounds = region ? getBounds(region.polygon) : null;
      return region && bounds
        ? [
            {
              area: getPolygonArea(region.polygon),
              x: (bounds.minX + bounds.maxX) / 2 / image.width,
              y: (bounds.minY + bounds.maxY) / 2 / image.height,
            },
          ]
        : [];
    })
    .sort((a, b) => b.area - a.area);
  if (parts.length === 0) {
    return [{ x: 0.5, y: 0.5 }];
  }
  const minArea = parts[0].area * MIN_ANCHOR_SHARE;
  return parts.filter((part) => part.area >= minArea).map(({ x, y }) => ({ x, y }));
}

type GroupWithCandidates = PartGroup & { candidates: Anchor[] };

function assignSides(withCandidates: GroupWithCandidates[]): PartGroup[] {
  // The side is decided by the group's largest part; then its line lands on the part nearest
  // that side, so the line does not cross the photo to reach it.
  const groups = withCandidates.map((group) => ({ ...group, anchor: group.candidates[0] }));
  // Left of centre goes left; then the busier side gives up its most central cards.
  const byX = [...groups].sort((a, b) => a.anchor.x - b.anchor.x);
  let leftCount = byX.filter((group) => group.anchor.x < 0.5).length;
  const target = Math.ceil(byX.length / 2);
  leftCount = Math.min(Math.max(leftCount, byX.length - target), target);
  const sided = byX.map(({ candidates, ...group }, index) => {
    const side: PartSide = index < leftCount ? 'left' : 'right';
    const anchor = candidates.reduce((best, candidate) =>
      side === 'left'
        ? candidate.x < best.x
          ? candidate
          : best
        : candidate.x > best.x
          ? candidate
          : best
    );
    return { ...group, side, anchor };
  });
  return sided.sort((a, b) =>
    a.side === b.side ? a.anchor.y - b.anchor.y : a.side === 'left' ? -1 : 1
  );
}

function countWord(count: number): string {
  return NUMBER_WORDS[count] ?? String(count);
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
