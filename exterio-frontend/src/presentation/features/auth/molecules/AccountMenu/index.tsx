import { useCallback, useId, useRef, useState } from 'react';

import { Avatar } from '@/presentation/shared/atoms/Avatar';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { useDismiss } from '@/presentation/shared/hooks/useDismiss';
import type { User } from '@/domain/models/auth';

export interface AccountMenuProps {
  user: User;
  onSignOut: () => void;
}

/** The signed-in person as an avatar; clicking it shows who is signed in and a sign-out button. */
export function AccountMenu({ user, onSignOut }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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
        aria-label={`Account: ${user.name}`}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Avatar name={user.name} />
        <Icon name="chevron-down" className="h-4 w-4 text-stone-500" />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-72 animate-fade-in overflow-hidden rounded-xl border border-stone-200 bg-white shadow-raised"
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-stone-900">{user.name}</p>
              <p className="truncate text-sm text-stone-500">
                {user.isGuest ? 'Guest, saved in this browser' : user.email}
              </p>
            </div>
          </div>
          <div className="border-t border-stone-200 p-1.5">
            <button
              type="button"
              role="menuitem"
              autoFocus
              onClick={onSignOut}
              className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:bg-stone-100 focus-visible:outline-none"
            >
              <Icon name="logout" className="text-stone-500" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
