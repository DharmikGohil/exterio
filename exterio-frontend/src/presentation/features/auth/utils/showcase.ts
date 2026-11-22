/**
 * The houses the sign-in page shows, before and after. The images are rendered by Exterio's own
 * instant preview from the sample houses (`exterio-backend/scripts/render_showcase.py`), so they
 * show exactly what the product does.
 */
export interface ShowcaseHouse {
  key: string;
  house: string;
  design: string;
  finishes: string;
}

export const SHOWCASE_HOUSES: readonly ShowcaseHouse[] = [
  {
    key: 'ranch',
    house: 'Single-storey ranch',
    design: 'White farmhouse',
    finishes: 'Warm cream walls, charcoal metal roof, walnut garage door',
  },
  {
    key: 'two-storey',
    house: 'Two-storey with garage',
    design: 'Sage and charcoal',
    finishes: 'Sage grey walls and brick, charcoal shutters and garage door, metal roof',
  },
  {
    key: 'brick',
    house: 'Brick house with dormers',
    design: 'Limewashed brick',
    finishes: 'White-painted brick, charcoal metal roof and dormers, walnut garage doors',
  },
  {
    key: 'craftsman',
    house: 'Craftsman with stone',
    design: 'Sage, cream and sandstone',
    finishes: 'Sage gables, cream porch, sandstone columns and garage wall',
  },
];

export function showcaseImage(key: string, stage: 'before' | 'after'): string {
  return `/showcase/${key}-${stage}.jpg`;
}
