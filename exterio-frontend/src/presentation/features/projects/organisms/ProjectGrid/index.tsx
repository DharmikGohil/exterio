import { Button } from '@/presentation/shared/atoms/Button';
import { EmptyState } from '@/presentation/shared/molecules/EmptyState';
import { ErrorState } from '@/presentation/shared/molecules/ErrorState';
import { ProjectCard } from '@/presentation/features/projects/molecules/ProjectCard';
import { ProjectCardSkeleton } from '@/presentation/features/projects/molecules/ProjectCardSkeleton';
import type { ProjectSummary } from '@/domain/models/project';

const SKELETON_KEYS = ['a', 'b', 'c'] as const;
const GRID_CLASSES =
  'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6';

export interface ProjectGridProps {
  projects: ProjectSummary[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onRename: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
  onCreate: () => void;
  onCreateSample: () => void;
  isCreatingSample: boolean;
}

export function ProjectGrid({
  projects,
  isLoading,
  error,
  onRetry,
  onRename,
  onDelete,
  onCreate,
  onCreateSample,
  isCreatingSample,
}: ProjectGridProps) {
  if (isLoading) {
    return (
      <div className={GRID_CLASSES} aria-busy="true">
        {SKELETON_KEYS.map((key) => (
          <ProjectCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="We could not load your projects" error={error} onRetry={onRetry} />;
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon="home"
        title="No projects yet"
        description="A project is one house. Start from your own photo, or open the sample house to see the whole flow in about a minute."
        action={
          <>
            <Button icon="plus" onClick={onCreate}>
              New project
            </Button>
            <Button variant="outline" isLoading={isCreatingSample} onClick={onCreateSample}>
              Open a sample house
            </Button>
          </>
        }
      />
    );
  }

  return (
    <div className={GRID_CLASSES}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onRename={onRename} onDelete={onDelete} />
      ))}
    </div>
  );
}
