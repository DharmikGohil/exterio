import type { ReactNode } from 'react';

import { Logo } from '@/presentation/shared/atoms/Logo';

export interface AuthLayoutProps {
  /** The product's moment, filling the left half of the screen on wide screens. */
  visual: ReactNode;
  children: ReactNode;
}

/**
 * Signed-out shell, as a split screen: what the product does fills the left half, edge to edge,
 * and the way in sits on plain white in the right half. Phones get the form only.
 *
 * The form is anchored to the top, not centred: switching between Sign in and Create account
 * changes its height, and a centred form would jump up and down.
 */
export function AuthLayout({ visual, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="hidden lg:block">{visual}</aside>
      <div className="flex min-h-dvh flex-col px-6 py-6 sm:px-10 xl:px-16">
        <header className="flex h-10 items-center">
          <Logo />
        </header>
        <main className="flex flex-1 justify-center pb-10 pt-[8vh] lg:pt-[12vh]">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <footer className="text-xs text-stone-500">
          Estimates are advisory. Confirm quantities with your contractor before ordering
        </footer>
      </div>
    </div>
  );
}
