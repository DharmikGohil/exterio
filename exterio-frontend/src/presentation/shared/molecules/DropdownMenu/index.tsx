import { useCallback, useId, useRef, useState, type ReactNode } from 'react';

import { Icon, type IconName } from '@/presentation/shared/atoms/Icon';
import { useDismiss } from '@/presentation/shared/hooks/useDismiss';
import { cn } from '@/presentation/shared/utils/cn';

export interface DropdownMenuItem {
  key: string;
  label: string;
  icon?: IconName;
  onSelect: () => void;
  disabled?: boolean;
  /** Shown as a native tooltip, e.g. why an item is disabled. */
  title?: string;
  tone?: 'default' | 'danger';
  /** Marks the current choice in a menu that picks one of several (a check is drawn). */
  checked?: boolean;
}

export interface DropdownMenuProps {
  /** Accessible name of the menu, e.g. "Design options". */
  label: string;
  /** What the trigger button shows. */
  trigger: ReactNode;
  /** Accessible name of the trigger when its content is only an icon. */
  triggerLabel?: string;
  triggerClassName?: string;
  items: readonly DropdownMenuItem[];
  align?: 'start' | 'end';
}

/**
 * A button that opens a short list of actions or choices. Closes on Escape (returning focus to
 * the button), on a click outside, and after a choice.
 */
export function DropdownMenu({
  label,
  trigger,
  triggerLabel,
  triggerClassName,
  items,
  align = 'start',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const isChoice = items.some((item) => item.checked !== undefined);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);
  useDismiss(containerRef, isOpen, close);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={triggerLabel}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          triggerClassName
        )}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={cn(
            'absolute top-full z-50 mt-2 min-w-[14rem] max-w-xs animate-fade-in overflow-hidden rounded-xl border border-stone-200 bg-white p-1.5 shadow-raised',
            align === 'start' ? 'left-0' : 'right-0'
          )}
        >
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role={isChoice ? 'menuitemradio' : 'menuitem'}
              aria-checked={isChoice ? Boolean(item.checked) : undefined}
              autoFocus={index === 0}
              disabled={item.disabled}
              title={item.title}
              onClick={() => {
                setIsOpen(false);
                item.onSelect();
              }}
              className={cn(
                'flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[15px] transition-colors',
                'focus-visible:bg-stone-100 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-40',
                item.tone === 'danger'
                  ? 'text-red-700 hover:bg-red-50'
                  : 'text-stone-800 hover:bg-stone-100 hover:text-stone-900'
              )}
            >
              {item.icon && <Icon name={item.icon} className="shrink-0" />}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.checked && <Icon name="check" className="shrink-0 text-brand-700" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
