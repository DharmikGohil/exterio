import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Icon } from '@/presentation/shared/atoms/Icon';
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

/**
 * Where you are (a breadcrumb back to all projects), the five-step stepper and the studio's tools.
 * Projects are renamed on the home screen, not here.
 */
export function StudioTopBar({
  project,
  currentStep,
  hasPhoto,
  onStepChange,
  actions,
}: StudioTopBarProps) {
  return (
    <div className="border-b border-stone-200">
      <div className="flex w-full flex-col gap-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link
            to={ROUTES.home}
            className="flex shrink-0 items-center gap-1.5 rounded-md text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Icon name="arrow-left" />
            Projects
          </Link>
          <span aria-hidden className="text-stone-300">
            /
          </span>
          <h1 className="truncate text-base font-medium text-stone-900" aria-current="page">
            {project.name}
          </h1>
        </nav>
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
