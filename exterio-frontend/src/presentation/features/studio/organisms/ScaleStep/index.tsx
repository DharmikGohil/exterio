import { Button } from '@/presentation/shared/atoms/Button';
import { UnsavedChangesDialog } from '@/presentation/shared/molecules/UnsavedChangesDialog';
import { useScaleStep } from '@/presentation/features/studio/hooks/useScaleStep';
import { ScaleMethodPicker } from '@/presentation/features/studio/molecules/ScaleMethodPicker';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import { ScaleCanvas } from '@/presentation/features/studio/organisms/ScaleCanvas';
import { ScaleMethodForm } from '@/presentation/features/studio/organisms/ScaleMethodForm';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Project, ProjectImage } from '@/domain/models/project';

export interface ScaleStepProps {
  project: Project;
  image: ProjectImage;
  onStepChange: (step: StudioStep) => void;
}

export function ScaleStep({ project, image, onStepChange }: ScaleStepProps) {
  const editor = useScaleStep(project, image);
  const doorRegions = project.regions.filter((region) => region.label === 'door');

  return (
    <div className="space-y-4">
      <StepHeader
        title="Set the real-world size"
        description="A photo only knows pixels. One real measurement turns your regions into square feet, and square feet into a cost."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-3">
          <ScaleCanvas
            image={image}
            scale={editor.scale}
            doorRegions={doorRegions}
            onMoveCorner={editor.moveCorner}
            onMoveReferencePoint={editor.moveReferencePoint}
          />
          <p className="text-sm leading-relaxed text-stone-600">
            Drag the four corners onto the corners of the main front wall. This also corrects for a
            photo taken at an angle.
          </p>
        </div>

        <aside className="flex flex-col self-start rounded-xl border border-stone-200 bg-white lg:sticky lg:top-20">
          <div className="space-y-4 p-4">
            <section>
              <h3 className="flex items-center gap-2 text-sm font-medium text-stone-900">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-stone-100 font-mono text-[11px] text-stone-600">
                  1
                </span>
                Outline the front wall on the photo
              </h3>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-stone-900">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-stone-100 font-mono text-[11px] text-stone-600">
                  2
                </span>
                Give one real size
              </h3>
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
          </div>

          <div className="space-y-2.5 border-t border-stone-200 px-4 py-3">
            <p className="text-sm text-stone-600" aria-live="polite">
              {editor.problem && (editor.isDirty || !editor.isSaved)
                ? editor.problem
                : editor.isDirty
                  ? 'Unsaved changes'
                  : editor.isSaved
                    ? 'Scale saved. Estimates use it.'
                    : 'No scale saved yet. Estimates use a rough guess of about 10 ft per floor.'}
            </p>
            <div className="flex gap-2">
              <Button
                icon="save"
                className="min-w-0 flex-1"
                disabled={!editor.canSave}
                isLoading={editor.isSaving}
                onClick={editor.save}
              >
                Save scale
              </Button>
              {editor.isDirty && (
                <Button
                  variant="outline"
                  icon="undo"
                  disabled={editor.isSaving}
                  onClick={editor.discardChanges}
                >
                  Discard
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      <StepFooter
        step="scale"
        onStepChange={onStepChange}
        hint={editor.isDirty ? 'Save the scale before moving on.' : undefined}
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
