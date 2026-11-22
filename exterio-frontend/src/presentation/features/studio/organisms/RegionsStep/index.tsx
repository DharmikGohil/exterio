import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Tooltip } from '@/presentation/shared/atoms/Tooltip';
import { ShimmerOverlay } from '@/presentation/shared/molecules/ShimmerOverlay';
import { NameTagToggle } from '@/presentation/shared/molecules/NameTagToggle';
import { useElementSize } from '@/presentation/shared/hooks/useElementSize';
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
import { maxPhotoHeight, photoFrameStyle } from '@/presentation/shared/utils/photoFrame';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Project, ProjectImage } from '@/domain/models/project';

const ONE_LINE_TOOLBAR_PX = 44;
/** How the undo shortcut is written on this computer. */
const SHORTCUT_PREFIX =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

const AUTO_DETECT_UNAVAILABLE =
  'AI detection is not configured on this server. You can still mark every region by hand with Draw region.';

function getCanvasHint(isDrawing: boolean, pointCount: number, hasSelection: boolean): string {
  if (isDrawing) {
    return pointCount < 3
      ? 'Click around the edge of one part of the house. You need at least 3 points.'
      : 'Click the green first point or press Enter to close the shape. Esc cancels; Backspace or Ctrl+Z removes the last point.';
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
  // The row of tools above the photo; the photo gives up whatever height it really takes.
  const toolbar = useElementSize<HTMLDivElement>();
  const toolbarHeight = toolbar.height || ONE_LINE_TOOLBAR_PX;
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

      {/*
        The tools sit in a row above the photo, as wide as it, so they never cover a part of the
        house: drawing and detection on the left, undo and redo on the right. On the photo itself
        only the names toggle (top right), a hint while editing, and the save bar.
      */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div
          ref={toolbar.ref}
          role="toolbar"
          aria-label="Region tools"
          className="mx-auto flex min-w-fit max-w-full flex-wrap items-center justify-between gap-2"
          style={photoFrameStyle(image.width, image.height, toolbarHeight)}
        >
          <div className="flex flex-wrap items-center gap-2">
            {editor.isDrawing ? (
              <>
                <Button
                  size="lg"
                  icon="check"
                  disabled={!editor.canFinishDrawing}
                  onClick={editor.finishDrawing}
                >
                  Finish shape
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  icon="undo"
                  disabled={editor.drawPoints.length === 0}
                  onClick={editor.undoDrawPoint}
                >
                  Undo point
                </Button>
                <Button size="lg" variant="ghost" icon="x" onClick={editor.cancelDrawing}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" variant="secondary" icon="draw" onClick={editor.startDrawing}>
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
                    size="lg"
                    variant="outline"
                    icon="shapes"
                    disabled={!editor.canAutoDetect}
                    isLoading={editor.isDetecting}
                    onClick={editor.requestDetection}
                  >
                    Auto-detect
                  </Button>
                </Tooltip>
                {editor.selectedVertexIndex !== null && (
                  <Button
                    size="lg"
                    variant="outline"
                    icon="trash"
                    onClick={editor.removeSelectedVertex}
                  >
                    Remove point
                  </Button>
                )}
              </>
            )}
          </div>
          {!editor.isDrawing && (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-11 w-11"
                aria-label="Undo"
                title={`Undo (${SHORTCUT_PREFIX}Z)`}
                disabled={!editor.canUndo}
                onClick={editor.undo}
              >
                <Icon name="undo" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-11 w-11"
                aria-label="Redo"
                title={`Redo (${SHORTCUT_PREFIX}Shift+Z)`}
                disabled={!editor.canRedo}
                onClick={editor.redo}
              >
                <Icon name="redo" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div
          className="relative mx-auto min-w-0"
          style={photoFrameStyle(image.width, image.height, toolbarHeight)}
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
          maxHeight={maxPhotoHeight(toolbarHeight)}
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
