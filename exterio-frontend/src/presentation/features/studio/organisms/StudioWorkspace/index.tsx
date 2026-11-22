import { usePageTour } from '@/presentation/shared/contexts/GuidedTourContext';
import { HeaderSlot } from '@/presentation/shared/contexts/HeaderSlotContext';
import { AdvisorDockProvider } from '@/presentation/features/advisor/contexts/AdvisorDockContext';
import { useActiveDesign } from '@/presentation/features/design/hooks/useActiveDesign';
import { DesignStep } from '@/presentation/features/design/organisms/DesignStep';
import { EstimateStep } from '@/presentation/features/estimate/organisms/EstimateStep';
import { useStudioStep } from '@/presentation/features/studio/hooks/useStudioStep';
import { PhotoStep } from '@/presentation/features/studio/organisms/PhotoStep';
import { RegionsStep } from '@/presentation/features/studio/organisms/RegionsStep';
import { ScaleStep } from '@/presentation/features/studio/organisms/ScaleStep';
import { StudioHeaderNav } from '@/presentation/features/studio/organisms/StudioHeaderNav';
import { STUDIO_TOURS } from '@/presentation/features/studio/utils/studioTour';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Project, ProjectImage } from '@/domain/models/project';

export interface StudioWorkspaceProps {
  project: Project;
}

interface StepContentProps {
  step: StudioStep;
  project: Project;
  image: ProjectImage | null;
  onStepChange: (step: StudioStep) => void;
}

function StepContent({ step, project, image, onStepChange }: StepContentProps) {
  // Every step after the first works on the photo.
  if (step === 'photo' || !image) {
    return <PhotoStep project={project} onStepChange={onStepChange} />;
  }
  switch (step) {
    case 'regions':
      return <RegionsStep project={project} image={image} onStepChange={onStepChange} />;
    case 'scale':
      return <ScaleStep project={project} image={image} onStepChange={onStepChange} />;
    case 'design':
      return <DesignStep project={project} image={image} onStepChange={onStepChange} />;
    case 'estimate':
      return <EstimateStep project={project} onStepChange={onStepChange} />;
  }
}

/**
 * The Studio for one loaded project: its breadcrumb and stepper in the app header, the current
 * step, and the material advisor (whose panel outlives step changes). Each step has a short
 * guided tour, shown the first time it is opened in this browser.
 */
export function StudioWorkspace({ project }: StudioWorkspaceProps) {
  const { step, goToStep, hasPhoto } = useStudioStep(project);
  const { activeDesign } = useActiveDesign(project);
  usePageTour(STUDIO_TOURS[step]);

  return (
    <AdvisorDockProvider
      projectId={project.id}
      designId={activeDesign?.id}
      designName={activeDesign?.name}
    >
      <HeaderSlot>
        <StudioHeaderNav
          project={project}
          currentStep={step}
          hasPhoto={hasPhoto}
          onStepChange={goToStep}
        />
      </HeaderSlot>
      <div className="flex w-full flex-1 flex-col pt-7">
        <StepContent step={step} project={project} image={project.image} onStepChange={goToStep} />
      </div>
    </AdvisorDockProvider>
  );
}
