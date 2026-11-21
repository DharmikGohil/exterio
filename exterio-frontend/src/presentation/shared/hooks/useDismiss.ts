import { useEffect, type RefObject } from 'react';

/**
 * Closes a popover when the user clicks outside `containerRef` or presses Escape.
 * Only listens while `isOpen`, so closed menus cost nothing.
 */
export function useDismiss(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void
) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onDismiss();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isOpen, onDismiss]);
}
