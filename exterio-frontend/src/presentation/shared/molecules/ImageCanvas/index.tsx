import { forwardRef, type SVGProps } from 'react';

import { cn } from '@/presentation/shared/utils/cn';
import { maxPhotoHeight } from '@/presentation/shared/utils/photoFrame';

/** A one-line row of controls, the least a `rowAbove` row takes. */
const ONE_LINE_ROW_PX = 44;

export interface ImageCanvasProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'ref'> {
  imageUrl: string;
  /** Pixel size of the image; also the SVG coordinate system. */
  imageWidth: number;
  imageHeight: number;
  /** Accessible description of the canvas. */
  label: string;
  /**
   * `true` when a row of controls sits between the step title and the photo (the Design step's
   * design picker). The photo gives up that row's height so the step bar stays in view.
   */
  rowAbove?: boolean;
}

/**
 * A photo inside an SVG whose viewBox equals the image size, so anything drawn on top
 * uses image pixel coordinates directly. It scales to the container width and keeps the
 * photo's aspect ratio, and its height is capped so the whole photo, the studio header and the
 * pinned step bar fit on one screen (never shorter than 18rem on small windows); see
 * `utils/photoFrame`.
 */
export const ImageCanvas = forwardRef<SVGSVGElement, ImageCanvasProps>(
  (
    {
      imageUrl,
      imageWidth,
      imageHeight,
      label,
      rowAbove = false,
      className,
      style,
      children,
      ...rest
    },
    ref
  ) => (
    <svg
      ref={ref}
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      role="group"
      aria-label={label}
      className={cn('block h-auto w-full select-none rounded-2xl bg-stone-100', className)}
      style={{ maxHeight: maxPhotoHeight(rowAbove ? ONE_LINE_ROW_PX : 0), ...style }}
      {...rest}
    >
      <image
        href={imageUrl}
        width={imageWidth}
        height={imageHeight}
        preserveAspectRatio="none"
        className="pointer-events-none"
      />
      {children}
    </svg>
  )
);

ImageCanvas.displayName = 'ImageCanvas';
