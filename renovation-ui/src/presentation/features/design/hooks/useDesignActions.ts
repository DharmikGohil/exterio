import { useMutation } from '@tanstack/react-query';

import type { CreateDesignParams } from '@/domain/models/design';
import { useDesignContext } from '@/presentation/features/design/contexts/DesignContext';
import { useProjectCache } from '@/presentation/features/projects/hooks/useProjectCache';

/** Create (optionally as a copy), rename and delete designs of one project. */
export function useDesignActions(projectId: string) {
  const { designService } = useDesignContext();
  const cache = useProjectCache();

  const create = useMutation({
    mutationFn: (params: CreateDesignParams) => designService.createDesign(projectId, params),
    onSuccess: (design) => {
      cache.upsertDesign(design);
      void cache.invalidateLists();
    },
  });

  const rename = useMutation({
    mutationFn: ({ designId, name }: { designId: string; name: string }) =>
      designService.updateDesign(designId, { name }),
    // Only the name is taken from the response so in-flight material changes are not disturbed.
    onSuccess: (design) => {
      cache.patchDesign(projectId, design.id, (current) => ({
        ...current,
        name: design.name,
        updatedAt: design.updatedAt,
      }));
    },
  });

  const remove = useMutation({
    mutationFn: (designId: string) => designService.deleteDesign(designId),
    onSuccess: (_result, designId) => {
      cache.removeDesign(projectId, designId);
      void cache.invalidateLists();
    },
  });

  return {
    createDesign: create.mutateAsync,
    isCreating: create.isPending,
    createError: create.error,

    renameDesign: rename.mutateAsync,
    isRenaming: rename.isPending,

    deleteDesign: remove.mutateAsync,
    isDeleting: remove.isPending,
  };
}
