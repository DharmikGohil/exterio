import { useCallback, useEffect, useRef } from 'react';

import type { Project } from '@/domain/models/project';

import { useDesignActions } from './useDesignActions';

const DEFAULT_DESIGN_NAME = 'Design 1';

/** A project always needs a design to work on: create "Design 1" when there is none. */
export function useEnsureDefaultDesign(project: Project) {
  const { createDesign, isCreating, createError } = useDesignActions(project.id);
  const hasAttemptedRef = useRef(false);
  const hasDesigns = project.designs.length > 0;

  const createDefaultDesign = useCallback(() => {
    // The failure is surfaced through `error`, so the rejected promise needs no handler here.
    createDesign({ name: DEFAULT_DESIGN_NAME }).catch(() => undefined);
  }, [createDesign]);

  useEffect(() => {
    if (!hasDesigns && !hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      createDefaultDesign();
    }
  }, [hasDesigns, createDefaultDesign]);

  return {
    isCreatingDefault: !hasDesigns && isCreating,
    defaultDesignError: hasDesigns ? null : createError,
    retryCreateDefault: createDefaultDesign,
  };
}
