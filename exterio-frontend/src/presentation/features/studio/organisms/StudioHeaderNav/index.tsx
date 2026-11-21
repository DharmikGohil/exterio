import { Link } from 'react-router-dom';

import { StudioStepper } from '@/presentation/features/studio/molecules/StudioStepper';
import { ROUTES, type StudioStep } from '@/presentation/routes/paths';
import type { Project } from '@/domain/models/project';

export interface StudioHeaderNavProps {
  project: Project;
  currentStep: StudioStep;
  hasPhoto: boolean;
  onStepChange: (step: StudioStep) => void;
}

/**
 * The studio's part of the app header: which project this is (a link back to all projects) and
 * the five-step stepper. Projects are renamed on the home screen, not here.
 */
export function StudioHeaderNav({
  project,
  currentStep,
  hasPhoto,
  onStepChange,
}: StudioHeaderNavProps) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 md:flex">
        <span aria-hidden className="text-stone-300">
          /
        </span>
        <Link
          to={ROUTES.home}
          className="shrink-0 rounded-md text-sm text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Projects
        </Link>
        <span aria-hidden className="text-stone-300">
          /
        </span>
        <span className="truncate text-sm font-medium text-stone-900" aria-current="page">
          {project.name}
        </span>
      </nav>
      <StudioStepper currentStep={currentStep} hasPhoto={hasPhoto} onStepChange={onStepChange} />
    </>
  );
}
