import type { CSSProperties } from 'react';

/** Room kept for the studio header, the step title and the pinned step bar. */
const RESERVED = '18.5rem';
/** Never shorter than this, on small windows. */
const MIN_PHOTO_HEIGHT = '18rem';
/**
 * Space a row of controls above the photo takes beyond its own height (the gap under it, less
 * what `RESERVED` already allows for). With a one-line 44 px row this adds 3.5rem, as before.
 */
const ROW_EXTRA_PX = 12;

/** Tallest a step's photo may be, given the height of any row of controls above it. */
export function maxPhotoHeight(rowAboveHeight = 0): string {
  const row = rowAboveHeight > 0 ? ` - ${Math.round(rowAboveHeight + ROW_EXTRA_PX)}px` : '';
  return `max(${MIN_PHOTO_HEIGHT}, 100dvh - ${RESERVED}${row})`;
}

/**
 * The width at which a photo of this shape is exactly as tall as it may be, or the full column
 * if that is narrower. A frame given this width hugs the photo: no empty bands at the sides on
 * a wide screen, and the tools floating in its corners sit on the photo itself.
 *
 * `rowAboveHeight` is the measured height of a row of controls between the step title and the
 * photo, so a row that wraps onto two lines makes the photo shorter instead of pushing the step
 * bar off screen.
 */
export function photoFrameStyle(
  imageWidth: number,
  imageHeight: number,
  rowAboveHeight = 0
): CSSProperties {
  const ratio = imageWidth / Math.max(imageHeight, 1);
  return { width: `min(100%, calc((${maxPhotoHeight(rowAboveHeight)}) * ${ratio.toFixed(4)}))` };
}

/**
 * For a grid of a photo beside a side panel: the photo column's widest size, as the CSS variable
 * `--photo-col`. The grid uses `minmax(0, var(--photo-col))` for that column and centres its
 * tracks, so a tall photo keeps its panel right beside it instead of leaving a gap between them.
 */
export function photoGridStyle(
  imageWidth: number,
  imageHeight: number,
  rowAboveHeight = 0
): CSSProperties {
  const ratio = imageWidth / Math.max(imageHeight, 1);
  return {
    '--photo-col': `calc((${maxPhotoHeight(rowAboveHeight)}) * ${ratio.toFixed(4)})`,
  } as CSSProperties;
}
