import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { Project } from '@/domain/models/project';
import { STUDIO_PARAMS, type StudioStep } from '@/presentation/routes/paths';
import { getDefaultStep, isStudioStep } from '@/presentation/features/studio/utils/steps';

/**
 * The current Studio step, kept in the `?step=` query parameter.
 * Until a photo exists the only reachable step is `photo`; afterwards all steps are open.
 */
export function useStudioStep(project: Project) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get(STUDIO_PARAMS.step);
  const hasPhoto = project.image !== null;

  let step: StudioStep = 'photo';
  if (hasPhoto) {
    step = isStudioStep(requested) ? requested : getDefaultStep(project);
  }

  // Write the resolved step back so it stays put while the project changes underneath it.
  useEffect(() => {
    if (requested !== step) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set(STUDIO_PARAMS.step, step);
          return next;
        },
        { replace: true }
      );
    }
  }, [requested, step, setSearchParams]);

  const goToStep = useCallback(
    (next: StudioStep) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        params.set(STUDIO_PARAMS.step, next);
        // A sub-view belongs to the step it was opened on.
        params.delete(STUDIO_PARAMS.view);
        return params;
      });
    },
    [setSearchParams]
  );

  return { step, goToStep, hasPhoto };
}
