import { useCallback, useEffect, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * The rendered size of an element in CSS pixels, kept current as it resizes. Returns a callback
 * ref, so it follows the element even when React swaps it for a new one (a changed `key`).
 */
export function useElementSize<T extends HTMLElement>(): ElementSize & {
  ref: (element: T | null) => void;
} {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  const ref = useCallback((node: T | null) => setElement(node), []);

  useEffect(() => {
    if (!element) {
      return;
    }
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return { ref, ...size };
}
