import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import { Tooltip } from '@/presentation/shared/atoms/Tooltip';
import { ShimmerOverlay } from '@/presentation/shared/molecules/ShimmerOverlay';
import { NameTagToggle } from '@/presentation/shared/molecules/NameTagToggle';
import { useStoredToggle } from '@/presentation/shared/hooks/useStoredToggle';
import { ConfirmDialog } from '@/presentation/shared/molecules/ConfirmDialog';
import { FloatingSaveBar } from '@/presentation/shared/molecules/FloatingSaveBar';
import { UnsavedChangesDialog } from '@/presentation/shared/molecules/UnsavedChangesDialog';
import { AdvisorButton } from '@/presentation/features/advisor/molecules/AdvisorButton';
import { useRegionsStep } from '@/presentation/features/studio/hooks/useRegionsStep';
import { RegionLabelDialog } from '@/presentation/features/studio/molecules/RegionLabelDialog';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import { RegionCanvas } from '@/presentation/features/studio/organisms/RegionCanvas';
import { RegionListPanel } from '@/presentation/features/studio/organisms/RegionListPanel';
import { photoFrameStyle } from '@/presentation/shared/utils/photoFrame';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Project, ProjectImage } from '@/domain/models/project';

const AUTO_DETECT_UNAVAILABLE =
  'AI detection is not configured on this server. You can still mark every region by hand with Draw region.';

function getCanvasHint(isDrawing: boolean, pointCount: number, hasSelection: boolean): string {
  if (isDrawing) {
    return pointCount < 3
      ? 'Click around the edge of one part of the house. You need at least 3 points.'
      : 'Click the green first point or press Enter to close the shape. Esc cancels, Backspace removes the last point.';
  }
  if (hasSelection) {
    return 'Drag a point to move it. Double-click an edge to add a point. Right-click a point, or select it and press Delete, to remove it.';
  }
  return 'Click a region to select and adjust it.';
}

export interface RegionsStepProps {
  project: Project;
  image: ProjectImage;
  onStepChange: (step: StudioStep) => void;
}

export function RegionsStep({ project, image, onStepChange }: RegionsStepProps) {
  const editor = useRegionsStep(project);
  const nameTags = useStoredToggle('exterio.showRegionNames', true);
  const hint =
    editor.isDrawing || editor.selectedRegionId !== null
      ? getCanvasHint(editor.isDrawing, editor.drawPoints.length, editor.selectedRegionId !== null)
      : null;

  return (
    <div className="space-y-5">
      <StepHeader
        title="Mark the parts of the house"
        description="Each coloured shape is one part that can get its own finish. Correct anything the AI got wrong or missed."
        actions={<AdvisorButton />}
      />

      {!editor.isLoadingCapabilities && !editor.canAutoDetect && (
        <Alert tone="info" title="Auto-detect is switched off">
          {AUTO_DETECT_UNAVAILABLE}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div
          className="relative mx-auto min-w-0"
          style={photoFrameStyle(image.width, image.height)}
        >
          <RegionCanvas
            image={image}
            regions={editor.regions}
            selectedRegionId={editor.selectedRegionId}
            selectedVertexIndex={editor.selectedVertexIndex}
            isDrawing={editor.isDrawing}
            drawPoints={editor.drawPoints}
            canFinishDrawing={editor.canFinishDrawing}
            onSelectRegion={editor.selectRegion}
            onSelectVertex={editor.selectVertex}
            onMoveVertex={editor.moveVertex}
            onInsertVertex={editor.insertVertex}
            onRemoveVertex={editor.removeVertex}
            onAddDrawPoint={editor.addDrawPoint}
            onFinishDrawing={editor.finishDrawing}
            showNames={nameTags.isOn}
          />
          {editor.isDetecting && (
            <ShimmerOverlay status="Finding walls, windows, pillars and railings…" />
          )}

          {/* Tools float on the photo: drawing top left, names top right, saving bottom centre. */}
          <div
            role="toolbar"
            aria-label="Region tools"
            className="absolute left-4 top-4 z-10 flex w-44 flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-raised"
          >
            {editor.isDrawing ? (
              <>
                <Button
                  icon="check"
                  fullWidth
                  disabled={!editor.canFinishDrawing}
                  onClick={editor.finishDrawing}
                >
                  Finish shape
                </Button>
                <Button
                  variant="outline"
                  icon="undo"
                  fullWidth
                  disabled={editor.drawPoints.length === 0}
                  onClick={editor.undoDrawPoint}
                >
                  Undo point
                </Button>
                <Button variant="ghost" icon="x" fullWidth onClick={editor.cancelDrawing}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" icon="draw" fullWidth onClick={editor.startDrawing}>
                  Draw region
                </Button>
                <Tooltip
                  side="bottom"
                  content={
                    editor.canAutoDetect
                      ? 'Let the AI find walls, windows, doors and more'
                      : 'AI detection is not configured. Draw regions by hand.'
                  }
                >
                  <Button
                    variant="outline"
                    icon="shapes"
                    fullWidth
                    disabled={!editor.canAutoDetect}
                    isLoading={editor.isDetecting}
                    onClick={editor.requestDetection}
                  >
                    Auto-detect
                  </Button>
                </Tooltip>
                {editor.selectedVertexIndex !== null && (
                  <Button
                    variant="outline"
                    icon="trash"
                    fullWidth
                    onClick={editor.removeSelectedVertex}
                  >
                    Remove point
                  </Button>
                )}
              </>
            )}
          </div>

          <NameTagToggle
            isOn={nameTags.isOn}
            onToggle={nameTags.toggle}
            className="absolute right-4 top-4 z-10"
          />

          {hint && (
            <p
              aria-live="polite"
              className="pointer-events-none absolute left-1/2 top-4 z-10 hidden max-w-md -translate-x-1/2 rounded-xl bg-ink/85 px-3 py-2 text-center text-sm leading-snug text-white md:block"
            >
              {hint}
            </p>
          )}

          {editor.isDirty && (
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
              <FloatingSaveBar
                onSave={editor.save}
                onDiscard={editor.discardChanges}
                isSaving={editor.isSaving}
                saveLabel="Save regions"
              />
            </div>
          )}
        </div>

        <RegionListPanel
          isLoading={editor.isDetecting}
          regions={editor.regions}
          selectedRegionId={editor.selectedRegionId}
          onSelect={editor.selectRegion}
          onChange={editor.updateRegion}
          onDelete={editor.deleteRegion}
        />
      </div>

      <StepFooter
        step="regions"
        onStepChange={onStepChange}
        hint={editor.isDirty ? 'Save your regions before moving on.' : undefined}
      />

      <RegionLabelDialog
        open={editor.pendingPolygon !== null}
        regions={editor.regions}
        onConfirm={editor.confirmDrawnRegion}
        onCancel={editor.discardDrawnRegion}
      />

      <ConfirmDialog
        open={editor.isDetectConfirmOpen}
        title="Run auto-detect again?"
        description="Regions found by the AI earlier are replaced with a fresh detection. Regions you drew yourself are kept, but edits you have not saved will be lost."
        confirmLabel="Auto-detect"
        onConfirm={editor.runDetection}
        onCancel={editor.cancelDetection}
      />

      <UnsavedChangesDialog
        open={editor.leaveGuard.isBlocked}
        subject="Your region edits"
        onStay={editor.leaveGuard.stay}
        onLeave={editor.leaveGuard.leave}
      />
    </div>
  );
}
