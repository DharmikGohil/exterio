import { createBrowserRouter } from 'react-router-dom';

import { UserMenu } from '@/presentation/features/auth/molecules/UserMenu';
import { LoginPage } from '@/presentation/features/auth/pages/LoginPage';
import { ProjectListPage } from '@/presentation/features/projects/pages/ProjectListPage';
import { StudioPage } from '@/presentation/features/studio/pages/StudioPage';
import { AuthGuard } from '@/presentation/shared/guards/AuthGuard';
import { GuestOnlyGuard } from '@/presentation/shared/guards/GuestOnlyGuard';
import { AppLayout } from '@/presentation/shared/layouts/AppLayout';
import { CenteredLayout } from '@/presentation/shared/layouts/CenteredLayout';
import { NotFoundState } from '@/presentation/shared/molecules/NotFoundState';

import { ROUTES } from './paths';

/**
 * A data router is used so the Studio can pause navigation while there are unsaved edits
 * (see `useUnsavedChangesGuard`).
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.login,
    element: (
      <GuestOnlyGuard>
        <LoginPage />
      </GuestOnlyGuard>
    ),
  },
  {
    element: (
      <AuthGuard>
        <AppLayout homeHref={ROUTES.home} headerRight={<UserMenu />} />
      </AuthGuard>
    ),
    children: [
      { path: ROUTES.home, element: <ProjectListPage /> },
      { path: ROUTES.projectPattern, element: <StudioPage /> },
    ],
  },
  {
    path: '*',
    element: (
      <CenteredLayout>
        <NotFoundState homeHref={ROUTES.home} />
      </CenteredLayout>
    ),
  },
]);
