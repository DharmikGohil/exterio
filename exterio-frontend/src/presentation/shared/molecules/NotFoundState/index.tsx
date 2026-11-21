import { Link } from 'react-router-dom';

import { EmptyState } from '@/presentation/shared/molecules/EmptyState';

export interface NotFoundStateProps {
  homeHref: string;
}

export function NotFoundState({ homeHref }: NotFoundStateProps) {
  return (
    <EmptyState
      icon="folder"
      title="This page does not exist"
      description="The link may be old, or the project may have been deleted."
      action={
        <Link
          to={homeHref}
          className="inline-flex h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Go to your projects
        </Link>
      }
      className="w-full max-w-md"
    />
  );
}
