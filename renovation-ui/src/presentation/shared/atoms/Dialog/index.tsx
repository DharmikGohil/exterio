import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
} as const;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Action buttons, right-aligned. */
  footer?: ReactNode;
  size?: keyof typeof SIZE_CLASSES;
}

/** A modal dialog: closes on Escape or backdrop click and locks page scroll while open. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return;
    }
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    // Leave focus alone when a field inside asked for it via autoFocus.
    if (panel && !panel.contains(document.activeElement)) {
      panel.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    document.body.classList.add('overflow-hidden');

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.classList.remove('overflow-hidden');
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        aria-hidden
        className="absolute inset-0 animate-fade-in bg-stone-950/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[90dvh] w-full animate-slide-up flex-col rounded-t-2xl bg-white shadow-raised outline-none sm:rounded-xl',
          SIZE_CLASSES[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-medium text-stone-900">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-sm leading-relaxed text-stone-600">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2"
            aria-label="Close"
            onClick={onClose}
          >
            <Icon name="x" />
          </Button>
        </div>
        {children && <div className="overflow-y-auto px-5 py-4">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 px-5 pb-5 pt-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
