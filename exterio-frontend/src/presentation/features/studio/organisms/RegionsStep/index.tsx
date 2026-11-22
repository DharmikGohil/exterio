import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Tooltip } from '@/presentation/shared/atoms/Tooltip';
import { NameTagToggle } from '@/presentation/shared/molecules/NameTagToggle';
import { useElementSize } from '@/presentation/shared/hooks/useElementSize';
import { useStoredToggle } from '@/presentation/shared/hooks/useStoredToggle';
import { ConfirmDialog } from '@/presentation/shared/molecules/ConfirmDialog';
import { FloatingSaveBar } from '@/presentation/shared/molecules/FloatingSaveBar';
import { UnsavedChangesDialog } from '@/presentation/shared/molecules/UnsavedChangesDialog';
import { AdvisorButton } from '@/presentation/features/advisor/molecules/AdvisorButton';
import { useRegionsStep } from '@/presentation/features/studio/hooks/useRegionsStep';
import { DetectionProgress } from '@/presentation/features/studio/molecules/DetectionProgress';
import { RegionLabelDialog } from '@/presentation/features/studio/molecules/RegionLabelDialog';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import { RegionCanvas } from '@/presentation/features/studio/organisms/RegionCanvas';
import { RegionListPanel } from '@/presentation/features/studio/organisms/RegionListPanel';
import {
  maxPhotoHeight,
  photoFrameStyle,
  photoGridStyle,
} from '@/presentation/shared/utils/photoFrame';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Project, ProjectImage } from '@/domain/models/project';

const ONE_LINE_TOOLBAR_PX = 44;
/** How the undo shortcut is written on this computer. */
const SHORTCUT_PREFIX =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

const AUTO_DETECT_UNAVAILABLE =
  'AI detection is not configured on this server. You can still mark every region by hand with Draw region.';

/** One short line under the tools saying what the photo does now. It never covers the photo. */
function getCanvasHint(isDrawing: boolean, pointCount: number, hasSelection: boolean): string {
  if (isDrawing) {
    return pointCount < 3
      ? 'Click around the edge of one part (at least 3 points).'
      : `Click the first point or press Enter to close · Esc cancels · ${SHORTCUT_PREFIX}Z undoes a point`;
  }
  if (hasSelection) {
    return 'Drag a point to move it · double-click an edge to add one · Delete removes a point';
  }
  return 'Click a part to adjust it, or draw one that is missing.';
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
  const hint = getCanvasHint(
    editor.isDrawing,
    editor.drawPoints.length,
    editor.selectedRegionId !== null
  );

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
        The tools sit in a row above the photo and the panel, so they never cover a part of the
        house: drawing and detection on the left over the photo, undo and redo on the right. On the photo itself
        only the names toggle (top right) and the save bar. The hint line under the tools is
        always there, so the photo never moves when it changes.
      */}
      <div
        className="grid gap-5 lg:grid-cols-[minmax(0,var(--photo-col))_24rem] lg:justify-center"
        style={photoGridStyle(image.width, image.height, toolbarHeight)}
      >
        {/* Spans the photo and the panel, so a tall, narrow photo never squeezes the tools. */}
        <div ref={toolbar.ref} className="min-w-0 space-y-2 lg:col-span-2">
          <div
            role="toolbar"
            aria-label="Region tools"
            className="flex flex-wrap items-center justify-between gap-2"
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
          {/* Zero intrinsic width: a long hint wraps to the row's width instead of widening it. */}
          <p
            aria-live="polite"
            className="w-0 min-w-full truncate text-sm text-stone-600"
            title={hint}
          >
            {hint}
          </p>
        </div>
      </div>

      <div
        className="grid gap-5 lg:grid-cols-[minmax(0,var(--photo-col))_24rem] lg:justify-center"
        style={photoGridStyle(image.width, image.height, toolbarHeight)}
      >
        <div
          className="relative mx-auto min-w-0"
          style={photoFrameStyle(image.width, image.height, toolbarHeight)}
        >
          <RegionCanvas
            image={image}
            regions={editor.displayedRegions}
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
            freshIds={editor.freshRegionIds}
          />
          <DetectionProgress {...editor.detection} />

          <NameTagToggle
            isOn={nameTags.isOn}
            onToggle={nameTags.toggle}
            className="absolute right-4 top-4 z-10"
          />

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
          freshIds={editor.freshRegionIds}
          isLoading={editor.isDetecting && editor.detection.found === 0}
          regions={editor.displayedRegions}
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
