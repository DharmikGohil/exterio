import type { Point } from '@/domain/models/project';

export const NAME_TAG_HEIGHT_PX = 18;
export const NAME_TAG_PADDING_X_PX = 6;
export const NAME_TAG_BAR_WIDTH_PX = 3;
const INSET_PX = 4;
const GAP_PX = 2;
const MAX_SHIFTS = 6;
/** IBM Plex Sans at 11px averages about this wide per character. */
const CHAR_WIDTH_PX = 6.1;

export interface NameTagInput {
  id: string;
  name: string;
  polygon: Point[];
}

export interface NameTagPlacement {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlaps(a: NameTagPlacement, b: NameTagPlacement): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * Places one tag inside the top-left corner of each region. Regions often share a corner
 * (a wall and the roof band above it), so a tag that would cover one already placed moves
 * down a row until it is clear.
 */
export function layoutNameTags(items: NameTagInput[], unitsPerPixel: number): NameTagPlacement[] {
  const unit = unitsPerPixel;
  const placed: NameTagPlacement[] = [];
  for (const item of items) {
    if (item.polygon.length === 0) {
      continue;
    }
    const tag: NameTagPlacement = {
      id: item.id,
      name: item.name,
      x: Math.min(...item.polygon.map((point) => point[0])) + INSET_PX * unit,
      y: Math.min(...item.polygon.map((point) => point[1])) + INSET_PX * unit,
      width:
        (item.name.length * CHAR_WIDTH_PX + NAME_TAG_PADDING_X_PX * 2 + NAME_TAG_BAR_WIDTH_PX) *
        unit,
      height: NAME_TAG_HEIGHT_PX * unit,
    };
    for (
      let shift = 0;
      shift < MAX_SHIFTS && placed.some((other) => overlaps(tag, other));
      shift++
    ) {
      tag.y += (NAME_TAG_HEIGHT_PX + GAP_PX) * unit;
    }
    placed.push(tag);
  }
  return placed;
}
