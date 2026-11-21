import { Alert } from '@/presentation/shared/atoms/Alert';
import { Badge } from '@/presentation/shared/atoms/Badge';
import { Button } from '@/presentation/shared/atoms/Button';
import { Tooltip } from '@/presentation/shared/atoms/Tooltip';
import { ShimmerOverlay } from '@/presentation/shared/molecules/ShimmerOverlay';
import { NameTagToggle } from '@/presentation/shared/molecules/NameTagToggle';
import { useStoredToggle } from '@/presentation/shared/hooks/useStoredToggle';
import { ConfirmDialog } from '@/presentation/shared/molecules/ConfirmDialog';
import { UnsavedChangesDialog } from '@/presentation/shared/molecules/UnsavedChangesDialog';
import { useRegionsStep } from '@/presentation/features/studio/hooks/useRegionsStep';
import { RegionLabelDialog } from '@/presentation/features/studio/molecules/RegionLabelDialog';
import { RegionLegend } from '@/presentation/features/studio/molecules/RegionLegend';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import { RegionCanvas } from '@/presentation/features/studio/organisms/RegionCanvas';
import { RegionListPanel } from '@/presentation/features/studio/organisms/RegionListPanel';
import type { StudioStep } from '@/presentation/routes/paths';
import { REGION_LABELS, type Project, type ProjectImage } from '@/domain/models/project';

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
  const usedLabels = REGION_LABELS.filter((label) =>
    editor.regions.some((region) => region.label === label)
  );

  return (
    <div className="space-y-4">
      <StepHeader
        title="Mark the parts of the house"
        description="Each coloured shape is one part that can get its own finish. Let the AI find them, then correct anything it got wrong or missed."
        actions={
          <>
            {editor.isDirty && <Badge tone="warning">Unsaved changes</Badge>}
            <Button
              variant="outline"
              icon="undo"
              disabled={!editor.isDirty || editor.isSaving}
              onClick={editor.discardChanges}
            >
              Discard
            </Button>
            <Button
              icon="save"
              disabled={!editor.isDirty}
              isLoading={editor.isSaving}
              onClick={editor.save}
            >
              Save regions
            </Button>
          </>
        }
      />

      {!editor.isLoadingCapabilities && !editor.canAutoDetect && (
        <Alert tone="info" title="Auto-detect is switched off">
          {AUTO_DETECT_UNAVAILABLE}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {editor.isDrawing ? (
              <>
                <Button
                  size="sm"
                  icon="check"
                  disabled={!editor.canFinishDrawing}
                  onClick={editor.finishDrawing}
                >
                  Finish shape
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon="undo"
                  disabled={editor.drawPoints.length === 0}
                  onClick={editor.undoDrawPoint}
                >
                  Undo point
                </Button>
                <Button size="sm" variant="ghost" icon="x" onClick={editor.cancelDrawing}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="secondary" icon="draw" onClick={editor.startDrawing}>
                  Draw region
                </Button>
                <Tooltip
                  content={
                    editor.canAutoDetect
                      ? 'Let the AI find walls, windows, doors and more'
                      : 'AI detection is not configured. Draw regions by hand.'
                  }
                >
                  <Button
                    size="sm"
                    variant="outline"
                    icon="shapes"
                    disabled={!editor.canAutoDetect}
                    isLoading={editor.isDetecting}
                    onClick={editor.requestDetection}
                  >
                    Auto-detect regions
                  </Button>
                </Tooltip>
                <NameTagToggle isOn={nameTags.isOn} onToggle={nameTags.toggle} />
                {editor.selectedVertexIndex !== null && (
                  <Button
                    size="sm"
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

          <div className="relative">
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
          </div>

          <p className="text-sm leading-relaxed text-stone-600" aria-live="polite">
            {getCanvasHint(
              editor.isDrawing,
              editor.drawPoints.length,
              editor.selectedRegionId !== null
            )}
          </p>
          <RegionLegend labels={usedLabels} />
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
