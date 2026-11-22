import { SHOWCASE_DATA } from './showcaseData';

/** An arrow from a finish to the part of the house it is on. */
export interface ShowcaseCallout {
  /** "Walls", "Garage door and shutters". */
  parts: string;
  /** "Warm cream paint". */
  finish: string;
  /** What that finish costs on this house, materials and labour, in rupees. */
  cost: number;
  /** Where the arrow lands, as fractions of the photo's width and height. */
  x: number;
  y: number;
}

export interface ShowcaseHouse {
  key: string;
  house: string;
  design: string;
  /** The whole design's estimate, in rupees. */
  total: number;
  /** Width over height of the photo, so arrow points land where they were measured. */
  aspect: number;
  /** The costliest finishes, left to right by where they land. */
  callouts: ShowcaseCallout[];
}

/**
 * The houses the sign-in page shows. Photos, renders, costs and arrow points all come from the
 * sample houses through the product's own preview and estimate
 * (`exterio-backend/scripts/render_showcase.py`), so the page shows exactly what the studio does.
 */
export const SHOWCASE_HOUSES: readonly ShowcaseHouse[] = SHOWCASE_DATA;

export function showcaseImage(key: string, stage: 'before' | 'after'): string {
  return `/showcase/${key}-${stage}.jpg`;
}

/** Labels sit in a row along the top of the photo, over the sky: left, middle and right. */
export const LABEL_SLOTS = [0.02, 0.345, 0.67] as const;
export const LABEL_WIDTH = 0.31;
/** Where an arrow leaves its label: the label's bottom edge, as a fraction of the height. */
export const LABEL_BOTTOM = 0.23;

/** Which slot each callout's label takes: callouts are ordered left to right, so are slots. */
export function labelSlots(count: number): number[] {
  if (count === 1) {
    return [LABEL_SLOTS[1]];
  }
  if (count === 2) {
    return [LABEL_SLOTS[0], LABEL_SLOTS[2]];
  }
  return [...LABEL_SLOTS].slice(0, count);
}
