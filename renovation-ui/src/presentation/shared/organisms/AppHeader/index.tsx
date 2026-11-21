import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Logo } from '@/presentation/shared/atoms/Logo';
import { PAGE_FRAME } from '@/presentation/shared/utils/pageFrame';

export interface AppHeaderProps {
  /** Where the brand links to. */
  homeHref: string;
  /** Content on the right, e.g. the user menu. */
  rightSlot?: ReactNode;
}

/** The brand on the left and the user menu on the right, above the page. */
export function AppHeader({ homeHref, rightSlot }: AppHeaderProps) {
  return (
    <header className={`flex h-14 items-center justify-between gap-4 ${PAGE_FRAME}`}>
      <Link
        to={homeHref}
        className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <Logo />
      </Link>
      {rightSlot}
    </header>
  );
}
