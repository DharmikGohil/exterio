import { Link, useParams } from 'react-router-dom';

import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { ErrorState } from '@/presentation/shared/molecules/ErrorState';
import { useProject } from '@/presentation/features/projects/hooks/useProject';
import { StudioWorkspace } from '@/presentation/features/studio/organisms/StudioWorkspace';
import { ROUTES } from '@/presentation/routes/paths';

export function StudioPage() {
  const { projectId } = useParams();
  const { project, isLoading, error, refetch } = useProject(projectId);

  if (isLoading) {
    return (
      <div aria-busy="true" className="w-full space-y-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-8 w-full max-w-md" />
        </div>
        <Skeleton className="h-6 w-72" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full max-w-2xl space-y-4 py-9">
        <ErrorState title="We could not open this project" error={error} onRetry={refetch} />
        <Link
          to={ROUTES.home}
          className="inline-block text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          ← Back to all projects
        </Link>
      </div>
    );
  }

  // A fresh workspace per project, so no editing state leaks from one house to the next.
  return <StudioWorkspace key={project.id} project={project} />;
}
