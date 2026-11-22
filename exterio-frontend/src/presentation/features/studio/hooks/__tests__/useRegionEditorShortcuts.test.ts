import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRegionEditorShortcuts } from '@/presentation/features/studio/hooks/useRegionEditorShortcuts';

function setup(isDrawing: boolean) {
  const handlers = {
    isDrawing,
    onFinishDrawing: vi.fn(),
    onCancelDrawing: vi.fn(),
    onUndoPoint: vi.fn(),
    onRemoveSelectedVertex: vi.fn(),
    onClearSelection: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
  };
  renderHook(() => useRegionEditorShortcuts(handlers));
  return handlers;
}

const press = (init: KeyboardEventInit) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { cancelable: true, ...init }));

describe('useRegionEditorShortcuts', () => {
  it('undoes with Ctrl+Z or Cmd+Z and redoes with Ctrl+Shift+Z or Ctrl+Y', () => {
    const handlers = setup(false);

    press({ key: 'z', ctrlKey: true });
    press({ key: 'z', metaKey: true });
    press({ key: 'Z', ctrlKey: true, shiftKey: true });
    press({ key: 'y', ctrlKey: true });

    expect(handlers.onUndo).toHaveBeenCalledTimes(2);
    expect(handlers.onRedo).toHaveBeenCalledTimes(2);
  });

  it('removes the last point instead while drawing', () => {
    const handlers = setup(true);

    press({ key: 'z', ctrlKey: true });

    expect(handlers.onUndoPoint).toHaveBeenCalledOnce();
    expect(handlers.onUndo).not.toHaveBeenCalled();
  });

  it('leaves Ctrl+Z to a text field being typed in', () => {
    const handlers = setup(false);
    const input = document.createElement('input');
    document.body.append(input);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));

    expect(handlers.onUndo).not.toHaveBeenCalled();
    input.remove();
  });
});
