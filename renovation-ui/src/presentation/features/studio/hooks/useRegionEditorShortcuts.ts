import { useEffect, useRef } from 'react';

export interface RegionEditorShortcutHandlers {
  isDrawing: boolean;
  /** Enter while drawing. */
  onFinishDrawing: () => void;
  /** Escape while drawing. */
  onCancelDrawing: () => void;
  /** Backspace while drawing. */
  onUndoPoint: () => void;
  /** Delete / Backspace with a vertex selected. */
  onRemoveSelectedVertex: () => void;
  /** Escape while not drawing. */
  onClearSelection: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/** Keyboard shortcuts for the region editor. Ignored while typing in a field or a dialog. */
export function useRegionEditorShortcuts(handlers: RegionEditorShortcutHandlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || document.querySelector('[role="dialog"]')) {
        return;
      }
      const current = handlersRef.current;

      if (current.isDrawing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          current.onFinishDrawing();
        } else if (event.key === 'Escape') {
          current.onCancelDrawing();
        } else if (event.key === 'Backspace') {
          event.preventDefault();
          current.onUndoPoint();
        }
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        current.onRemoveSelectedVertex();
      } else if (event.key === 'Escape') {
        current.onClearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
