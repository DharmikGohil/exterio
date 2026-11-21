import { AdvisorLauncher } from '@/presentation/features/advisor/organisms/AdvisorLauncher';
import { useActiveDesign } from '@/presentation/features/design/hooks/useActiveDesign';
import { DesignStep } from '@/presentation/features/design/organisms/DesignStep';
import { EstimateStep } from '@/presentation/features/estimate/organisms/EstimateStep';
import { useStudioStep } from '@/presentation/features/studio/hooks/useStudioStep';
import { PhotoStep } from '@/presentation/features/studio/organisms/PhotoStep';
import { RegionsStep } from '@/presentation/features/studio/organisms/RegionsStep';
import { ScaleStep } from '@/presentation/features/studio/organisms/ScaleStep';
import { StudioTopBar } from '@/presentation/features/studio/organisms/StudioTopBar';
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

/** The Studio for one loaded project: top bar, the current step and the advisor. */
export function StudioWorkspace({ project }: StudioWorkspaceProps) {
  const { step, goToStep, hasPhoto } = useStudioStep(project);
  const { activeDesign } = useActiveDesign(project);

  return (
    <>
      <StudioTopBar
        project={project}
        currentStep={step}
        hasPhoto={hasPhoto}
        onStepChange={goToStep}
        actions={
          <AdvisorLauncher
            projectId={project.id}
            designId={activeDesign?.id}
            designName={activeDesign?.name}
          />
        }
      />
      <div className="flex w-full flex-1 flex-col pt-4">
        <StepContent step={step} project={project} image={project.image} onStepChange={goToStep} />
      </div>
    </>
  );
}
