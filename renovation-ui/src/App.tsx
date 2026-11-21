import { RouterProvider } from 'react-router-dom';

import { router } from '@/presentation/routes/router';
import { AppProviders } from '@/presentation/shared/providers/AppProviders';

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
