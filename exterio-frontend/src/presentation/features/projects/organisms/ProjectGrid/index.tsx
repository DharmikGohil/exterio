import { ErrorState } from '@/presentation/shared/molecules/ErrorState';
import { NewHouseCard } from '@/presentation/features/projects/molecules/NewHouseCard';
import { ProjectCard } from '@/presentation/features/projects/molecules/ProjectCard';
import { ProjectCardSkeleton } from '@/presentation/features/projects/molecules/ProjectCardSkeleton';
import type { ProjectSummary } from '@/domain/models/project';

const SKELETON_KEYS = ['a', 'b', 'c'] as const;
const GRID_CLASSES =
  'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1920px]:grid-cols-5';

export interface ProjectGridProps {
  /** The houses to show, already searched and sorted. */
  projects: ProjectSummary[];
  /** What the list was searched for; the new-house card steps aside while searching. */
  query: string;
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
  query,
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
    return <ErrorState title="We could not load your houses" error={error} onRetry={onRetry} />;
  }

  const isSearching = query.trim() !== '';
  if (isSearching && projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 px-6 py-10 text-center text-[15px] text-stone-600">
        No house is called anything like “{query.trim()}”.
      </p>
    );
  }

  return (
    <div className={GRID_CLASSES}>
      {!isSearching && (
        <NewHouseCard
          onCreate={onCreate}
          onCreateSample={onCreateSample}
          isCreatingSample={isCreatingSample}
        />
      )}
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onRename={onRename} onDelete={onDelete} />
      ))}
    </div>
  );
}
