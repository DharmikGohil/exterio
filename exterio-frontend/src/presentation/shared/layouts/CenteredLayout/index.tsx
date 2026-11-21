import type { ReactNode } from 'react';

import { PageBackdrop } from '@/presentation/shared/organisms/PageBackdrop';

export interface CenteredLayoutProps {
  children: ReactNode;
}

/** One card in the middle of the page, for pages with a single message, like a 404. */
export function CenteredLayout({ children }: CenteredLayoutProps) {
  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center p-4">
      <PageBackdrop />
      {children}
    </div>
  );
}
