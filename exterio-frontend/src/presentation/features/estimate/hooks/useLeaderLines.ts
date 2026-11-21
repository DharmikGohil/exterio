import { useCallback, useLayoutEffect, useState, type RefObject } from 'react';

export interface LeaderLine {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Measures where each part card's leader line should run: from the card's inner edge to its dot
 * on the photo, in the container's own coordinates. Cards are marked `data-part-card="<key>"`
 * with `data-side`, dots `data-part-dot="<key>"`.
 *
 * Lines are only drawn while a card sits beside the photo; when the layout stacks (narrow
 * screens) there is no room for them and none are returned. Re-measures when the container
 * resizes and when `revision` changes (new cards, a loaded photo).
 */
export function useLeaderLines(
  containerRef: RefObject<HTMLElement | null>,
  revision: unknown
): { lines: LeaderLine[]; remeasure: () => void } {
  const [lines, setLines] = useState<LeaderLine[]>([]);

  const remeasure = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const box = container.getBoundingClientRect();
    const next: LeaderLine[] = [];
    container.querySelectorAll<HTMLElement>('[data-part-card]').forEach((card) => {
      const key = card.dataset.partCard ?? '';
      const dot = container.querySelector<HTMLElement>(`[data-part-dot="${key}"]`);
      if (!dot) {
        return;
      }
      const cardBox = card.getBoundingClientRect();
      const dotBox = dot.getBoundingClientRect();
      const isLeft = card.dataset.side === 'left';
      const edgeX = isLeft ? cardBox.right : cardBox.left;
      const dotX = dotBox.left + dotBox.width / 2;
      const isBeside = isLeft ? edgeX < dotX : edgeX > dotX;
      if (!isBeside || cardBox.width === 0) {
        return;
      }
      next.push({
        key,
        x1: edgeX - box.left,
        y1: cardBox.top + cardBox.height / 2 - box.top,
        x2: dotX - box.left,
        y2: dotBox.top + dotBox.height / 2 - box.top,
      });
    });
    setLines(next);
  }, [containerRef]);

  useLayoutEffect(() => {
    remeasure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(remeasure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, remeasure, revision]);

  return { lines, remeasure };
}
