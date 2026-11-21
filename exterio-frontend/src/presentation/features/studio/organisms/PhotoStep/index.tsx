import { Alert } from '@/presentation/shared/atoms/Alert';
import { Badge } from '@/presentation/shared/atoms/Badge';
import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { ConfirmDialog } from '@/presentation/shared/molecules/ConfirmDialog';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';
import { usePhotoStep } from '@/presentation/features/studio/hooks/usePhotoStep';
import { PhotoCheckingPreview } from '@/presentation/features/studio/molecules/PhotoCheckingPreview';
import { PhotoDropzone } from '@/presentation/features/studio/molecules/PhotoDropzone';
import { QualityReportSkeleton } from '@/presentation/features/studio/molecules/QualityReportSkeleton';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import { QualityReportCard } from '@/presentation/features/studio/organisms/QualityReportCard';
import type { StudioStep } from '@/presentation/routes/paths';
import { config } from '@/config';
import type { Project } from '@/domain/models/project';
import { AdvisorButton } from '@/presentation/features/advisor/molecules/AdvisorButton';

const PHOTO_TIPS = [
  'Stand straight in front of the house, far enough to fit the whole front.',
  'Shoot in daylight, with the sun behind you if possible.',
  'Avoid parked vehicles, trees or people covering the walls.',
];

const PHOTO_GRID = 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]';

export interface PhotoStepProps {
  project: Project;
  onStepChange: (step: StudioStep) => void;
}

export function PhotoStep({ project, onStepChange }: PhotoStepProps) {
  const photo = usePhotoStep(project);
  const image = project.image;
  const isChecking = photo.isUploading && photo.localPreviewUrl !== null;
  const rejectedPreviewUrl = photo.rejection && !photo.isUploading ? photo.localPreviewUrl : null;

  return (
    <div className="space-y-5">
      <StepHeader
        title="House photo"
        description="Everything starts from one clear photo of the front of the house. We check it right away and tell you if a better shot would help."
        actions={
          <>
            <AdvisorButton />
            {image && !isChecking && !photo.rejection && (
              <Button variant="outline" icon="image-plus" onClick={photo.requestReplace}>
                Replace photo
              </Button>
            )}
          </>
        }
      />

      <input
        ref={photo.fileInputRef}
        type="file"
        accept={config.upload.acceptedExtensions}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={photo.handleFileInputChange}
      />

      {photo.errorMessage && !isChecking && (
        <Alert tone="error" title="The photo could not be uploaded">
          {photo.errorMessage}
        </Alert>
      )}

      {isChecking && photo.localPreviewUrl ? (
        <div className={PHOTO_GRID}>
          <PhotoCheckingPreview
            imageUrl={photo.localPreviewUrl}
            stages={photo.checkingStages}
            activeIndex={photo.activeCheckingStage}
          />
          <QualityReportSkeleton />
        </div>
      ) : photo.rejection ? (
        <div className="space-y-5 animate-fade-in">
          <Alert tone="error" title="This photo can't be used">
            {photo.rejection.message}
            {image && ' Your current photo has been kept.'}
          </Alert>
          <div className={PHOTO_GRID}>
            {rejectedPreviewUrl ? (
              <div className="relative overflow-hidden rounded-xl border-2 border-red-200 bg-stone-100">
                <img
                  src={rejectedPreviewUrl}
                  alt="The photo that was not accepted"
                  className="max-h-[60vh] w-full object-contain grayscale-[40%]"
                />
                <div className="absolute left-3 top-3">
                  <Badge tone="danger">Not accepted</Badge>
                </div>
              </div>
            ) : (
              <div />
            )}
            {photo.rejection.quality && (
              <QualityReportCard report={photo.rejection.quality} className="self-start" />
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button icon="upload" onClick={photo.browseFiles}>
              Try another photo
            </Button>
            {image && (
              <Button variant="outline" onClick={photo.dismissRejection}>
                Keep my current photo
              </Button>
            )}
          </div>
        </div>
      ) : image ? (
        <div className={`${PHOTO_GRID} animate-fade-in`}>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
            <img
              src={resolveFileUrl(image.url)}
              alt={`Front of ${project.name}`}
              width={image.width}
              height={image.height}
              className="max-h-[72vh] w-full object-contain"
            />
          </div>
          <QualityReportCard report={image.quality} className="self-start" />
        </div>
      ) : (
        <div className={PHOTO_GRID}>
          <PhotoDropzone
            onFileSelected={photo.uploadImage}
            onBrowse={photo.browseFiles}
            isUploading={photo.isUploading}
          />
          <aside className="space-y-3 self-start rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-medium text-stone-900">What makes a good photo</h3>
            <ul className="space-y-2">
              {PHOTO_TIPS.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm leading-relaxed text-stone-600">
                  <Icon name="check" className="mt-0.5 text-emerald-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}

      {image && !isChecking && !photo.rejection && (
        <StepFooter step="photo" onStepChange={onStepChange} />
      )}

      <ConfirmDialog
        open={photo.isReplaceConfirmOpen}
        title="Replace the photo?"
        description="The regions you marked belong to the current photo, so replacing it resets them and clears the finishes applied in your designs."
        confirmLabel="Choose a new photo"
        tone="danger"
        onConfirm={photo.confirmReplace}
        onCancel={photo.cancelReplace}
      />
    </div>
  );
}
