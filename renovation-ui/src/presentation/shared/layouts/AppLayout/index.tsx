import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import { AppHeader } from '@/presentation/shared/organisms/AppHeader';
import { PageBackdrop } from '@/presentation/shared/organisms/PageBackdrop';
import { PAGE_FRAME } from '@/presentation/shared/utils/pageFrame';

export interface AppLayoutProps {
  homeHref: string;
  /** Content on the right of the header, e.g. the user menu. */
  headerRight?: ReactNode;
  /** Extra floating UI rendered after the page. */
  children?: ReactNode;
}

/**
 * Signed-in shell: the header and the routed page on the drafting-paper backdrop, both across
 * the full width of the window.
 */
export function AppLayout({ homeHref, headerRight, children }: AppLayoutProps) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <PageBackdrop />
      <AppHeader homeHref={homeHref} rightSlot={headerRight} />
      <main className={`flex flex-1 flex-col ${PAGE_FRAME}`}>
        <Outlet />
      </main>
      {children}
    </div>
  );
}
