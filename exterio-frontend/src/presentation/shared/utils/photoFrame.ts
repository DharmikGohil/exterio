import type { CSSProperties } from 'react';

/** Tallest a step's photo may be: room is left for the studio header and the pinned step bar. */
export const MAX_PHOTO_HEIGHT = 'max(22rem, 100dvh - 18.5rem)';
/** The same, when a row of controls sits between the step title and the photo. */
export const MAX_PHOTO_HEIGHT_ROW_ABOVE = 'max(22rem, 100dvh - 22rem)';

/**
 * The width at which a photo of this shape is exactly as tall as it may be, or the full column
 * if that is narrower. A frame given this width hugs the photo: no empty bands at the sides on
 * a wide screen, and the tools floating in its corners sit on the photo itself.
 */
export function photoFrameStyle(
  imageWidth: number,
  imageHeight: number,
  rowAbove = false
): CSSProperties {
  const ratio = imageWidth / Math.max(imageHeight, 1);
  const maxHeight = rowAbove ? MAX_PHOTO_HEIGHT_ROW_ABOVE : MAX_PHOTO_HEIGHT;
  return { width: `min(100%, calc((${maxHeight}) * ${ratio.toFixed(4)}))` };
}
