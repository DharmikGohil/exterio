import { useCallback } from 'react';

import type { Project } from '@/domain/models/project';
import { useProjectImageUpload } from '@/presentation/features/projects/hooks/useProjectImageUpload';
import { useDisclosure } from '@/presentation/shared/hooks/useDisclosure';

import { useCheckingStages } from './useCheckingStages';
import { useFilePicker } from './useFilePicker';
import { useLocalImagePreview } from './useLocalImagePreview';

/**
 * Upload / replace flow for the Photo step.
 *
 * The picked photo is shown immediately from the browser while the server checks it. If
 * the server accepts it the stored photo takes over; if it rejects it the local preview is
 * kept so the user sees which photo the report is about.
 */
export function usePhotoStep(project: Project) {
  const upload = useProjectImageUpload(project.id);
  const preview = useLocalImagePreview();
  const checking = useCheckingStages(upload.isUploading);
  const replaceConfirm = useDisclosure();

  const { uploadImage } = upload;
  const { showFile, clear } = preview;
  const uploadWithPreview = useCallback(
    (file: File) => {
      showFile(file);
      uploadImage(file, { onSuccess: clear });
    },
    [showFile, clear, uploadImage]
  );

  const picker = useFilePicker(uploadWithPreview);

  const hasWorkToLose =
    project.regions.length > 0 ||
    project.designs.some((design) => Object.keys(design.assignments).length > 0);

  const requestReplace = () => {
    if (hasWorkToLose) {
      replaceConfirm.open();
    } else {
      picker.openPicker();
    }
  };

  const { dismissFailure } = upload;
  const dismissRejection = useCallback(() => {
    dismissFailure();
    clear();
  }, [dismissFailure, clear]);

  const confirmReplace = () => {
    replaceConfirm.close();
    picker.openPicker();
  };

  return {
    isUploading: upload.isUploading,
    rejection: upload.rejection,
    errorMessage: upload.errorMessage,
    uploadImage: uploadWithPreview,
    /** Browser preview of the photo being checked, or of the last rejected photo. */
    localPreviewUrl: preview.previewUrl,
    checkingStages: checking.stages,
    activeCheckingStage: checking.activeIndex,
    fileInputRef: picker.inputRef,
    handleFileInputChange: picker.handleChange,
    browseFiles: picker.openPicker,
    requestReplace,
    dismissRejection,
    isReplaceConfirmOpen: replaceConfirm.isOpen,
    confirmReplace,
    cancelReplace: replaceConfirm.close,
  };
}
