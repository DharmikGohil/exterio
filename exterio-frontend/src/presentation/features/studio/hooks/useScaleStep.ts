import { useCallback, useMemo } from 'react';

import type {
  FacadeCorners,
  Point,
  Project,
  ProjectImage,
  ScaleMethod,
  ScaleReference,
} from '@/domain/models/project';
import { describeScaleProblem } from '@/domain/utils/scale';
import { useScaleActions } from '@/presentation/features/projects/hooks/useScaleActions';
import {
  buildDefaultReferenceLine,
  buildDefaultScale,
} from '@/presentation/features/studio/utils/scaleDefaults';
import { STUDIO_PARAMS } from '@/presentation/routes/paths';
import { useSyncedDraft } from '@/presentation/shared/hooks/useSyncedDraft';
import { useUnsavedChangesGuard } from '@/presentation/shared/hooks/useUnsavedChangesGuard';

export type ScaleFieldPatch = Partial<
  Pick<
    ScaleReference,
    'facadeWidthFt' | 'facadeHeightFt' | 'referenceLengthFt' | 'doorHeightFt' | 'storeys'
  >
>;

/** Local draft of the scale reference plus validation and saving. */
export function useScaleStep(project: Project, image: ProjectImage) {
  const { saveScale, isSavingScale } = useScaleActions(project.id);

  const savedSignature = useMemo(
    () => JSON.stringify([project.scale, image.width, image.height]),
    [project.scale, image.width, image.height]
  );
  const initialScale = useMemo(
    () => project.scale ?? buildDefaultScale(image, project.regions),
    [project.scale, image, project.regions]
  );
  const { draft: scale, updateDraft, resetDraft } = useSyncedDraft(initialScale, savedSignature);

  const isSaved = project.scale !== null;
  const isDirty = useMemo(
    () => JSON.stringify(scale) !== JSON.stringify(initialScale),
    [scale, initialScale]
  );
  const problem = describeScaleProblem(scale);
  const hasDoorRegion = project.regions.some((region) => region.label === 'door');
  const leaveGuard = useUnsavedChangesGuard(isDirty, STUDIO_PARAMS.step);

  const setMethod = useCallback(
    (method: ScaleMethod) => {
      updateDraft((current) => ({
        ...current,
        method,
        referenceLine:
          method === 'reference_line' && !current.referenceLine
            ? buildDefaultReferenceLine(image)
            : current.referenceLine,
      }));
    },
    [updateDraft, image]
  );

  const moveCorner = useCallback(
    (index: number, point: Point) => {
      updateDraft((current) => {
        const corners: FacadeCorners = [...current.facadeCorners];
        corners[index] = point;
        return { ...current, facadeCorners: corners };
      });
    },
    [updateDraft]
  );

  const moveReferencePoint = useCallback(
    (index: 0 | 1, point: Point) => {
      updateDraft((current) => {
        const line = current.referenceLine ?? buildDefaultReferenceLine(image);
        return {
          ...current,
          referenceLine: index === 0 ? [point, line[1]] : [line[0], point],
        };
      });
    },
    [updateDraft, image]
  );

  const setFields = useCallback(
    (patch: ScaleFieldPatch) => {
      updateDraft((current) => ({ ...current, ...patch }));
    },
    [updateDraft]
  );

  const save = useCallback(() => {
    if (!problem) {
      saveScale(scale);
    }
  }, [problem, saveScale, scale]);

  return {
    scale,
    isSaved,
    isDirty,
    problem,
    hasDoorRegion,
    canSave: !problem && (isDirty || !isSaved),
    setMethod,
    moveCorner,
    moveReferencePoint,
    setFields,
    save,
    isSaving: isSavingScale,
    discardChanges: resetDraft,
    leaveGuard,
  };
}
