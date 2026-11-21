import { forwardRef, type SVGProps } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

export interface ImageCanvasProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'ref'> {
  imageUrl: string;
  /** Pixel size of the image; also the SVG coordinate system. */
  imageWidth: number;
  imageHeight: number;
  /** Accessible description of the canvas. */
  label: string;
  /**
   * What sits between the step title and the photo in its column: a row of tools (`toolbar`,
   * the default) or nothing (`none`). The photo grows into the room a missing toolbar leaves.
   */
  toolbarAbove?: 'toolbar' | 'none';
}

/**
 * A photo inside an SVG whose viewBox equals the image size, so anything drawn on top
 * uses image pixel coordinates directly. It scales to the container width and keeps the
 * photo's aspect ratio, and its height is capped so the whole photo, the studio header and the
 * pinned step bar fit on one screen (never shorter than 22rem on small windows).
 */
export const ImageCanvas = forwardRef<SVGSVGElement, ImageCanvasProps>(
  (
    {
      imageUrl,
      imageWidth,
      imageHeight,
      label,
      toolbarAbove = 'toolbar',
      className,
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
      className={cn(
        'block h-auto w-full select-none rounded-xl bg-stone-100',
        toolbarAbove === 'toolbar'
          ? 'max-h-[max(22rem,calc(100dvh-24rem))]'
          : 'max-h-[max(22rem,calc(100dvh-21rem))]',
        className
      )}
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
