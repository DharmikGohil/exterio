import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Project, Region, RegionInput } from '@/domain/models/project';
import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';
import { useToast } from '@/presentation/shared/hooks/useToast';

import { useProjectCache } from './useProjectCache';

export interface DetectOptions {
  /** After the project has been saved with every part. */
  onSuccess?: (project: Project) => void;
}

/** Save (full replace) and AI auto-detect for a project's regions. */
export function useRegionActions(projectId: string) {
  const { projectService } = useProjectContext();
  const cache = useProjectCache();
  const toast = useToast();

  const save = useMutation({
    // One save at a time per project so a later edit can never be overwritten by an earlier one.
    scope: { id: `project-regions-${projectId}` },
    mutationFn: (regions: RegionInput[]) => projectService.saveRegions(projectId, regions),
    onSuccess: cache.setProject,
    onError: (error) => toast.error(error),
  });

  // Auto-detect streams: each part arrives the moment the AI has written it.
  const [isDetecting, setIsDetecting] = useState(false);
  const [foundRegions, setFoundRegions] = useState<Region[]>([]);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const detectRegions = useCallback(
    async ({ onSuccess }: DetectOptions = {}) => {
      requestRef.current?.abort();
      const request = new AbortController();
      requestRef.current = request;
      setFoundRegions([]);
      setIsDetecting(true);
      try {
        const project = await projectService.detectRegions(
          projectId,
          (region) => setFoundRegions((current) => [...current, region]),
          request.signal
        );
        cache.setProject(project);
        onSuccess?.(project);
      } catch (error) {
        if (!request.signal.aborted) {
          toast.error(error);
        }
      } finally {
        if (requestRef.current === request) {
          requestRef.current = null;
          setIsDetecting(false);
          setFoundRegions([]);
        }
      }
    },
    [cache, projectId, projectService, toast]
  );

  return {
    saveRegions: save.mutate,
    isSavingRegions: save.isPending,

    detectRegions,
    isDetectingRegions: isDetecting,
    /** The parts found so far while Auto-detect runs, in the order the AI wrote them. */
    detectedSoFar: foundRegions,
  };
}
