import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Logo } from '@/presentation/shared/atoms/Logo';
import { HeaderSlotTarget } from '@/presentation/shared/contexts/HeaderSlotContext';
import { PAGE_FRAME } from '@/presentation/shared/utils/pageFrame';

export interface AppHeaderProps {
  /** Where the brand links to. */
  homeHref: string;
  /** Content on the right, e.g. the user menu. */
  rightSlot?: ReactNode;
}

/**
 * The brand on the left, the user menu on the right, and between them whatever the current page
 * puts in the header slot (the studio's breadcrumb and stepper).
 */
export function AppHeader({ homeHref, rightSlot }: AppHeaderProps) {
  return (
    <header
      className={`flex h-16 items-center gap-6 border-b border-stone-200 bg-white ${PAGE_FRAME}`}
    >
      <Link
        to={homeHref}
        className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <Logo />
      </Link>
      <HeaderSlotTarget className="flex min-w-0 flex-1 items-center justify-between gap-6" />
      {rightSlot}
    </header>
  );
}
