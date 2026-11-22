import { Icon } from '@/presentation/shared/atoms/Icon';
import { UnsavedChangesDialog } from '@/presentation/shared/molecules/UnsavedChangesDialog';
import { cn } from '@/presentation/shared/utils/cn';
import { useScaleEditor } from '@/presentation/features/studio/hooks/useScaleEditor';
import { ScaleMethodPicker } from '@/presentation/features/studio/molecules/ScaleMethodPicker';
import { ScaleCanvas } from '@/presentation/features/studio/organisms/ScaleCanvas';
import { ScaleMethodForm } from '@/presentation/features/studio/organisms/ScaleMethodForm';
import { scaleSaveStatus } from '@/presentation/features/studio/utils/scaleSaveStatus';
import type { Project, ProjectImage } from '@/domain/models/project';

export interface ScaleEditorProps {
  project: Project;
  image: ProjectImage;
}

/**
 * The real-world size: outline the front wall on the photo and give one real measurement.
 * Saves as you type. Opened from the estimate, the only place the size is used.
 */
export function ScaleEditor({ project, image }: ScaleEditorProps) {
  const editor = useScaleEditor(project, image);
  const doorRegions = project.regions.filter((region) => region.label === 'door');
  const status = scaleSaveStatus(editor);

  return (
    <>
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

      <UnsavedChangesDialog
        open={editor.leaveGuard.isBlocked}
        subject="Your scale changes"
        onStay={editor.leaveGuard.stay}
        onLeave={editor.leaveGuard.leave}
      />
    </>
  );
}
