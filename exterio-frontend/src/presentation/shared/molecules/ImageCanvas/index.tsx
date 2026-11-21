import { forwardRef, type SVGProps } from 'react';

import { cn } from '@/presentation/shared/utils/cn';

export interface ImageCanvasProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'ref'> {
  imageUrl: string;
  /** Pixel size of the image; also the SVG coordinate system. */
  imageWidth: number;
  imageHeight: number;
  /** Accessible description of the canvas. */
  label: string;
}

/**
 * A photo inside an SVG whose viewBox equals the image size, so anything drawn on top
 * uses image pixel coordinates directly. It scales to the container width and keeps the
 * photo's aspect ratio.
 */
export const ImageCanvas = forwardRef<SVGSVGElement, ImageCanvasProps>(
  ({ imageUrl, imageWidth, imageHeight, label, className, children, ...rest }, ref) => (
    <svg
      ref={ref}
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      role="group"
      aria-label={label}
      className={cn(
        'block h-auto max-h-[72vh] w-full select-none rounded-xl bg-stone-200/70',
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
