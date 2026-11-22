import { useCallback, useState } from 'react';

import type { Project, RegionLabel } from '@/domain/models/project';
import { useRegionActions } from '@/presentation/features/projects/hooks/useRegionActions';
import { orderForReveal } from '@/presentation/features/studio/utils/detectionReveal';
import { toRegionInputs } from '@/presentation/features/studio/utils/regionDraft';
import { useCapabilities } from '@/presentation/features/system/hooks/useCapabilities';
import { STUDIO_PARAMS } from '@/presentation/routes/paths';
import { useDisclosure } from '@/presentation/shared/hooks/useDisclosure';
import { useToast } from '@/presentation/shared/hooks/useToast';
import { useUnsavedChangesGuard } from '@/presentation/shared/hooks/useUnsavedChangesGuard';

import { MIN_POLYGON_POINTS, useRegionDraft } from './useRegionDraft';
import { useRegionDrawing } from './useRegionDrawing';
import { useRegionEditorShortcuts } from './useRegionEditorShortcuts';
import { useRegionReveal } from './useRegionReveal';

/** Wires the Regions step together: local draft, selection, drawing, saving and detection. */
export function useRegionsStep(project: Project) {
  const toast = useToast();
  const { capabilities, isLoading: isLoadingCapabilities } = useCapabilities();
  const actions = useRegionActions(project.id);
  const draft = useRegionDraft(project.regions);
  const drawing = useRegionDrawing();
  const reveal = useRegionReveal();
  const detectConfirm = useDisclosure();
  const leaveGuard = useUnsavedChangesGuard(draft.isDirty, STUDIO_PARAMS.step);

  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);
  const selectedRegion = draft.regions.find((region) => region.id === selectedRegionId) ?? null;

  const selectRegion = useCallback((regionId: string | null) => {
    setSelectedRegionId(regionId);
    setSelectedVertexIndex(null);
  }, []);

  const removeVertex = useCallback(
    (regionId: string, index: number) => {
      const region = draft.regions.find((item) => item.id === regionId);
      if (!region) {
        return;
      }
      if (region.polygon.length <= MIN_POLYGON_POINTS) {
        toast.info(
          `A region needs at least ${MIN_POLYGON_POINTS} points. Delete the region instead.`
        );
        return;
      }
      draft.removeVertex(regionId, index);
      setSelectedVertexIndex(null);
    },
    [draft, toast]
  );

  const removeSelectedVertex = useCallback(() => {
    if (selectedRegionId !== null && selectedVertexIndex !== null) {
      removeVertex(selectedRegionId, selectedVertexIndex);
    }
  }, [selectedRegionId, selectedVertexIndex, removeVertex]);

  const deleteRegion = useCallback(
    (regionId: string) => {
      draft.deleteRegion(regionId);
      if (regionId === selectedRegionId) {
        selectRegion(null);
      }
    },
    [draft, selectedRegionId, selectRegion]
  );

  const startDrawing = useCallback(() => {
    reveal.stop();
    selectRegion(null);
    drawing.startDrawing();
  }, [drawing, reveal, selectRegion]);

  const confirmDrawnRegion = useCallback(
    (label: RegionLabel, name: string) => {
      if (!drawing.pendingPolygon) {
        return;
      }
      const regionId = draft.addRegion(label, name, drawing.pendingPolygon);
      drawing.clearPending();
      selectRegion(regionId);
    },
    [draft, drawing, selectRegion]
  );

  const save = useCallback(() => {
    actions.saveRegions(toRegionInputs(draft.regions), {
      onSuccess: () => toast.success('Regions saved.'),
    });
  }, [actions, draft.regions, toast]);

  const discardChanges = useCallback(() => {
    draft.discardChanges();
    selectRegion(null);
  }, [draft, selectRegion]);

  const undo = useCallback(() => {
    reveal.stop();
    draft.undo();
    setSelectedVertexIndex(null);
  }, [draft, reveal]);

  const redo = useCallback(() => {
    draft.redo();
    setSelectedVertexIndex(null);
  }, [draft]);

  const runDetection = useCallback(() => {
    // Detection replaces the regions; Undo can bring the earlier ones back.
    draft.checkpoint();
    detectConfirm.close();
    drawing.cancelDrawing();
    selectRegion(null);
    actions.detectRegions(undefined, {
      onSuccess: (updated) => {
        // The parts are drawn one after another; the status pill on the photo says how many.
        const found = orderForReveal(updated.regions);
        if (found.length > 0) {
          reveal.start(found);
        } else {
          toast.info('No regions were found. You can draw them by hand.');
        }
      },
    });
  }, [actions, detectConfirm, draft, drawing, reveal, selectRegion, toast]);

  // Detection replaces earlier AI regions and discards unsaved edits, so ask first.
  const requestDetection = useCallback(() => {
    if (draft.isDirty || project.regions.length > 0) {
      detectConfirm.open();
    } else {
      runDetection();
    }
  }, [draft.isDirty, project.regions.length, detectConfirm, runDetection]);

  useRegionEditorShortcuts({
    isDrawing: drawing.isDrawing,
    onFinishDrawing: drawing.finishDrawing,
    onCancelDrawing: drawing.cancelDrawing,
    onUndoPoint: drawing.undoPoint,
    onRemoveSelectedVertex: removeSelectedVertex,
    onClearSelection: () => selectRegion(null),
    onUndo: undo,
    onRedo: redo,
  });

  return {
    regions: draft.regions,
    isDirty: draft.isDirty,
    selectedRegion,
    selectedRegionId: selectedRegion?.id ?? null,
    selectedVertexIndex,
    selectRegion,
    selectVertex: setSelectedVertexIndex,
    moveVertex: draft.moveVertex,
    insertVertex: draft.insertVertex,
    removeVertex,
    removeSelectedVertex,
    updateRegion: draft.updateRegion,
    deleteRegion,

    isDrawing: drawing.isDrawing,
    drawPoints: drawing.drawPoints,
    canFinishDrawing: drawing.canFinish,
    pendingPolygon: drawing.pendingPolygon,
    startDrawing,
    cancelDrawing: drawing.cancelDrawing,
    addDrawPoint: drawing.addPoint,
    undoDrawPoint: drawing.undoPoint,
    finishDrawing: drawing.finishDrawing,
    confirmDrawnRegion,
    discardDrawnRegion: drawing.clearPending,

    undo,
    redo,
    canUndo: draft.canUndo,
    canRedo: draft.canRedo,

    save,
    isSaving: actions.isSavingRegions,
    discardChanges,

    reveal,

    canAutoDetect: capabilities.autoDetect,
    isLoadingCapabilities,
    requestDetection,
    runDetection,
    isDetecting: actions.isDetectingRegions,
    isDetectConfirmOpen: detectConfirm.isOpen,
    cancelDetection: detectConfirm.close,

    leaveGuard,
  };
}
