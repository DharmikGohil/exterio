import { useCallback, useEffect, useMemo, useRef } from 'react';

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

/** How long typing must pause before the scale is saved. */
export const SCALE_AUTOSAVE_DELAY_MS = 700;

/**
 * Local draft of the scale reference, validated and saved automatically.
 *
 * A valid change is saved once typing pauses, and a pending change is sent straight away when
 * the step is left. The draft is keyed to the photo, not to the saved scale, so a save that
 * returns while the user is still typing never replaces what they typed. Leaving is only
 * blocked when the values are invalid and so cannot be saved.
 */
export function useScaleStep(project: Project, image: ProjectImage) {
  const { saveScale, isSavingScale } = useScaleActions(project.id);

  const savedScale = useMemo(
    () => project.scale ?? buildDefaultScale(image, project.regions),
    [project.scale, image, project.regions]
  );
  const { draft: scale, updateDraft } = useSyncedDraft(
    savedScale,
    `${image.width}x${image.height}`
  );

  const isSaved = project.scale !== null;
  const draftJson = JSON.stringify(scale);
  const isDirty = draftJson !== JSON.stringify(savedScale);
  const problem = describeScaleProblem(scale);
  const hasDoorRegion = project.regions.some((region) => region.label === 'door');

  // What was last sent, so an unchanged draft is never saved twice (even if the server rounds).
  const lastSentRef = useRef<string | null>(null);
  const needsSave = !problem && (isDirty || !isSaved) && draftJson !== lastSentRef.current;

  const send = useCallback(
    (value: ScaleReference, json: string) => {
      lastSentRef.current = json;
      saveScale(value);
    },
    [saveScale]
  );

  useEffect(() => {
    if (!needsSave) {
      return undefined;
    }
    const timer = window.setTimeout(() => send(scale, draftJson), SCALE_AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [needsSave, scale, draftJson, send]);

  // Leaving the step before the pause ends still saves the last valid values.
  const pendingRef = useRef<{ value: ScaleReference; json: string } | null>(null);
  pendingRef.current = needsSave ? { value: scale, json: draftJson } : null;
  useEffect(
    () => () => {
      const pending = pendingRef.current;
      // Compared at unmount: the timer may already have sent these exact values.
      if (pending && pending.json !== lastSentRef.current) {
        send(pending.value, pending.json);
      }
    },
    [send]
  );

  const leaveGuard = useUnsavedChangesGuard(isDirty && problem !== null, STUDIO_PARAMS.step);

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

  return {
    scale,
    isSaved,
    problem,
    hasDoorRegion,
    /** A save is running, or one is waiting for typing to pause. */
    isSaving: isSavingScale || needsSave,
    setMethod,
    moveCorner,
    moveReferencePoint,
    setFields,
    leaveGuard,
  };
}
