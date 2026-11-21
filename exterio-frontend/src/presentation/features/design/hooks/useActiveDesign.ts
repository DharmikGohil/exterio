import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { Project } from '@/domain/models/project';
import { STUDIO_PARAMS } from '@/presentation/routes/paths';

/**
 * The design the user is working on, kept in the `?design=` query parameter so the Design
 * step, the Estimate step and the advisor all agree. Falls back to the first design.
 */
export function useActiveDesign(project: Project) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get(STUDIO_PARAMS.design);
  const activeDesign =
    project.designs.find((design) => design.id === requestedId) ?? project.designs[0] ?? null;

  const selectDesign = useCallback(
    (designId: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set(STUDIO_PARAMS.design, designId);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { activeDesign, selectDesign };
}
