import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Icon } from '@/presentation/shared/atoms/Icon';
import { InlineEditableText } from '@/presentation/shared/molecules/InlineEditableText';
import { useRenameProject } from '@/presentation/features/projects/hooks/useRenameProject';
import { StudioStepper } from '@/presentation/features/studio/molecules/StudioStepper';
import { ROUTES, type StudioStep } from '@/presentation/routes/paths';
import type { Project } from '@/domain/models/project';

export interface StudioTopBarProps {
  project: Project;
  currentStep: StudioStep;
  hasPhoto: boolean;
  onStepChange: (step: StudioStep) => void;
  /** Tools shown at the end of the bar, like the material advisor. */
  actions?: ReactNode;
}

/** Back link, the project name (click to rename) and the five-step stepper. */
export function StudioTopBar({
  project,
  currentStep,
  hasPhoto,
  onStepChange,
  actions,
}: StudioTopBarProps) {
  const { renameProject, isRenaming } = useRenameProject(project.id);

  return (
    <div className="border-b border-stone-200">
      <div className="flex w-full flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-1">
          <Link
            to={ROUTES.home}
            aria-label="Back to all projects"
            title="All projects"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Icon name="arrow-left" />
          </Link>
          <InlineEditableText
            value={project.name}
            label="Project name"
            disabled={isRenaming}
            onSave={renameProject}
            className="text-base"
          />
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <StudioStepper
            currentStep={currentStep}
            hasPhoto={hasPhoto}
            onStepChange={onStepChange}
          />
          {actions && (
            <>
              <span aria-hidden className="hidden h-5 w-px bg-stone-200 lg:block" />
              {actions}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
