import { Icon } from '@/presentation/shared/atoms/Icon';
import { UnsavedChangesDialog } from '@/presentation/shared/molecules/UnsavedChangesDialog';
import { cn } from '@/presentation/shared/utils/cn';
import { useScaleStep } from '@/presentation/features/studio/hooks/useScaleStep';
import { ScaleMethodPicker } from '@/presentation/features/studio/molecules/ScaleMethodPicker';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import { ScaleCanvas } from '@/presentation/features/studio/organisms/ScaleCanvas';
import { ScaleMethodForm } from '@/presentation/features/studio/organisms/ScaleMethodForm';
import { scaleSaveStatus } from '@/presentation/features/studio/utils/scaleSaveStatus';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Project, ProjectImage } from '@/domain/models/project';

export interface ScaleStepProps {
  project: Project;
  image: ProjectImage;
  onStepChange: (step: StudioStep) => void;
}

/**
 * Step 4, optional: outline the front wall on the photo and give one real size. Saves as you
 * type. Skipped, the estimate uses a rough size and says so.
 */
export function ScaleStep({ project, image, onStepChange }: ScaleStepProps) {
  const editor = useScaleStep(project, image);
  const doorRegions = project.regions.filter((region) => region.label === 'door');
  const status = scaleSaveStatus(editor);

  return (
    <div className="space-y-5">
      <StepHeader
        title="Set the real-world size"
        description="A photo only knows pixels. One real measurement turns your design into square feet, and square feet into a close cost. Optional: skip it and the estimate is a rough one."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="relative min-w-0">
          <ScaleCanvas
            image={image}
            scale={editor.scale}
            doorRegions={doorRegions}
            onMoveCorner={editor.moveCorner}
            onMoveReferencePoint={editor.moveReferencePoint}
          />
          <p className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 w-fit rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[15px] leading-snug text-stone-800 shadow-raised">
            Drag the four corners onto the corners of the front wall. This also corrects for an
            angled photo.
          </p>
        </div>

        <aside className="space-y-5 self-start rounded-2xl border border-stone-200 bg-white p-6 lg:sticky lg:top-6">
          <p className="flex items-center gap-2 text-[15px] font-medium text-stone-900">
            <Icon name="check" className="text-brand-700" />
            Wall outlined on the photo
          </p>

          <section className="space-y-4">
            <h3 className="text-lg font-medium text-stone-900">How do you know the size?</h3>
            <ScaleMethodPicker
              value={editor.scale.method}
              onChange={editor.setMethod}
              details={
                <ScaleMethodForm
                  scale={editor.scale}
                  hasDoorRegion={editor.hasDoorRegion}
                  onChange={editor.setFields}
                />
              }
            />
          </section>

          <p
            aria-live="polite"
            className={cn(
              'flex items-center gap-1.5 text-sm',
              status.tone === 'problem' ? 'text-amber-700' : 'text-stone-600'
            )}
          >
            {status.tone === 'saved' && <Icon name="check" className="h-4 w-4 text-brand-700" />}
            {status.tone === 'problem' && <Icon name="warning" className="h-4 w-4" />}
            {status.text}
          </p>
        </aside>
      </div>

      <StepFooter
        step="scale"
        onStepChange={onStepChange}
        hint={editor.problem ? 'Optional: continue and the estimate stays rough.' : undefined}
      />

      <UnsavedChangesDialog
        open={editor.leaveGuard.isBlocked}
        subject="Your scale changes"
        onStay={editor.leaveGuard.stay}
        onLeave={editor.leaveGuard.leave}
      />
    </div>
  );
}
