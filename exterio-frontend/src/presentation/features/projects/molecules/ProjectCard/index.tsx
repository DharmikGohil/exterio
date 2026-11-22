import { Link } from 'react-router-dom';

import { Icon } from '@/presentation/shared/atoms/Icon';
import { DropdownMenu } from '@/presentation/shared/molecules/DropdownMenu';
import { formatDate, formatInr, pluralise } from '@/presentation/shared/utils/format';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';
import { ROUTES } from '@/presentation/routes/paths';
import { StepProgress } from '@/presentation/features/projects/molecules/StepProgress';
import type { ProjectSummary } from '@/domain/models/project';

export interface ProjectCardProps {
  project: ProjectSummary;
  onRename: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
  /** Marks the card for the guided tour (the first card on the page). */
  tourTarget?: string;
}

/**
 * One house on the home screen: its photo, how far along it is, when it was last edited and
 * what it is estimated to cost. Rename and delete are in the ⋯ menu.
 */
export function ProjectCard({ project, onRename, onDelete, tourTarget }: ProjectCardProps) {
  const thumbnailUrl = resolveFileUrl(project.thumbnailUrl);

  return (
    <article
      data-tour={tourTarget}
      className="relative flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors hover:border-stone-300"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-stone-100">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-stone-500">
            No photo yet
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-[17px] font-medium text-stone-900">
            {/* The whole card opens the house; the menu sits above the link. */}
            <Link
              to={ROUTES.project(project.id)}
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brand-500"
            >
              {project.name}
            </Link>
          </h3>
          <div className="relative z-10 -mr-1 -mt-1">
            <DropdownMenu
              label={`Actions for ${project.name}`}
              triggerLabel={`More actions for ${project.name}`}
              align="end"
              triggerClassName="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
              trigger={<Icon name="more" className="h-5 w-5" />}
              items={[
                {
                  key: 'rename',
                  label: 'Rename',
                  icon: 'edit',
                  onSelect: () => onRename(project),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: 'trash',
                  tone: 'danger',
                  onSelect: () => onDelete(project),
                },
              ]}
            />
          </div>
        </div>
        <StepProgress step={project.progressStep} label={project.progressLabel} />
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-stone-100 pt-3">
          <p className="text-sm text-stone-500">
            {pluralise(project.designCount, 'design')} · edited {formatDate(project.updatedAt)}
          </p>
          {project.estimateTotal !== null ? (
            <p className="shrink-0 text-lg font-medium tabular-nums text-stone-900">
              {formatInr(project.estimateTotal)}
            </p>
          ) : (
            <p className="shrink-0 text-sm text-stone-500">No estimate yet</p>
          )}
        </div>
      </div>
    </article>
  );
}
