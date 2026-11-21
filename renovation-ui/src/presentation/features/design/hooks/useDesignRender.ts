import { useMutation, useQuery } from '@tanstack/react-query';

import { config } from '@/config';
import type { Design } from '@/domain/models/design';
import { useDesignContext } from '@/presentation/features/design/contexts/DesignContext';
import { useProjectCache } from '@/presentation/features/projects/hooks/useProjectCache';
import { useToast } from '@/presentation/shared/hooks/useToast';

import { DESIGN_QUERY_KEYS } from './designQueryKeys';

type RenderFields = Pick<Design, 'renderStatus' | 'renderError' | 'renderUrl'>;

const pickRenderFields = (design: Design): RenderFields => ({
  renderStatus: design.renderStatus,
  renderError: design.renderError,
  renderUrl: design.renderUrl,
});

/**
 * Photoreal render for a design: starts it, then polls the design while it is `pending`.
 * Only the render fields are copied into the cache so material changes made meanwhile
 * are left alone.
 */
export function useDesignRender(design: Design) {
  const { designService } = useDesignContext();
  const cache = useProjectCache();
  const toast = useToast();
  const { id: designId, projectId } = design;
  const isRendering = design.renderStatus === 'pending';

  const applyRenderState = (latest: Design) => {
    cache.patchDesign(projectId, designId, (current) => ({
      ...current,
      ...pickRenderFields(latest),
    }));
  };

  const { mutate: requestRender, isPending: isRequestingRender } = useMutation({
    mutationFn: () => designService.requestRender(designId),
    onSuccess: applyRenderState,
    onError: (error) => toast.error(error),
  });

  useQuery({
    queryKey: DESIGN_QUERY_KEYS.detail(designId),
    queryFn: async () => {
      const latest = await designService.getDesign(designId);
      applyRenderState(latest);
      return latest;
    },
    enabled: isRendering,
    refetchInterval: isRendering ? config.renderPollIntervalMs : false,
    staleTime: 0,
    gcTime: 0,
  });

  return { requestRender, isRequestingRender, isRendering };
}
