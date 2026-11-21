import { useMutation } from '@tanstack/react-query';

import { ImageRejectedError } from '@/application/features/project/errors';
import { useProjectContext } from '@/presentation/features/projects/contexts/ProjectContext';
import { getErrorMessage } from '@/presentation/shared/utils/errors';

import { useProjectCache } from './useProjectCache';

/**
 * Uploads (or replaces) the project photo.
 * A photo that fails the quality check is not an ordinary error: `rejection` carries the
 * quality report so the UI can explain what to fix.
 */
export function useProjectImageUpload(projectId: string) {
  const { projectService } = useProjectContext();
  const cache = useProjectCache();

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: (file: File) => projectService.uploadImage(projectId, file),
    onSuccess: cache.setProject,
  });

  const isRejection = error instanceof ImageRejectedError;

  return {
    uploadImage: mutate,
    /** Forget the last failed attempt, e.g. when the user keeps their current photo. */
    dismissFailure: reset,
    isUploading: isPending,
    rejection: isRejection ? { message: error.message, quality: error.quality } : null,
    errorMessage: error && !isRejection ? getErrorMessage(error) : null,
  };
}
