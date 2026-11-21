import { useCallback, useEffect, useRef, useState } from 'react';

import type { Point } from '@/domain/models/project';
import { clamp, roundPoint } from '@/presentation/shared/utils/geometry';

/**
 * Coordinate helpers for an `<svg viewBox="0 0 width height">` that is scaled to its container.
 *
 * - `toImagePoint` converts pointer (client) coordinates to image pixels using the SVG's
 *   screen transform, so it stays correct under any scaling, letterboxing or page scroll.
 * - `unitsPerPixel` is how many image pixels one CSS pixel covers; multiply a size in CSS
 *   pixels by it to draw handles that keep a constant on-screen size.
 */
export function useSvgCanvas(viewWidth: number, viewHeight: number) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [unitsPerPixel, setUnitsPerPixel] = useState(1);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const measure = () => {
      const { width, height } = svg.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setUnitsPerPixel(Math.max(viewWidth / width, viewHeight / height));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [viewWidth, viewHeight]);

  const toImagePoint = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const svg = svgRef.current;
      const screenMatrix = svg?.getScreenCTM();
      if (!svg || !screenMatrix) {
        return null;
      }
      const point = new DOMPoint(clientX, clientY).matrixTransform(screenMatrix.inverse());
      return roundPoint([clamp(point.x, 0, viewWidth), clamp(point.y, 0, viewHeight)]);
    },
    [viewWidth, viewHeight]
  );

  return { svgRef, unitsPerPixel, toImagePoint };
}
