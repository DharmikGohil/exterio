import { Link } from 'react-router-dom';

import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { formatDate, pluralise } from '@/presentation/shared/utils/format';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';
import { ROUTES } from '@/presentation/routes/paths';
import type { ProjectSummary } from '@/domain/models/project';

export interface ProjectCardProps {
  project: ProjectSummary;
  onDelete: (project: ProjectSummary) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const thumbnailUrl = resolveFileUrl(project.thumbnailUrl);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors hover:border-stone-300">
      <Link
        to={ROUTES.project(project.id)}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-stone-500">
              No photo yet
            </div>
          )}
        </div>
        <div className="space-y-1 px-4 py-3 pr-12">
          <h3 className="truncate text-base font-medium text-stone-900">{project.name}</h3>
          <p className="font-mono text-xs text-stone-500">
            {pluralise(project.designCount, 'design')} · {formatDate(project.updatedAt)}
          </p>
        </div>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${project.name}`}
        className="absolute bottom-3 right-3 text-stone-400 hover:bg-red-50 hover:text-red-700"
        onClick={() => onDelete(project)}
      >
        <Icon name="trash" />
      </Button>
    </article>
  );
}
