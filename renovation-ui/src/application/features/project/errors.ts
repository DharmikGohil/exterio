import { AppError } from '@/application/shared/errors';
import type { QualityReport } from '@/domain/models/project';

/** The uploaded photo failed the quality check (HTTP 422, code IMAGE_002). */
export class ImageRejectedError extends AppError {
  constructor(
    message: string,
    public readonly quality: QualityReport | null
  ) {
    super(message, 'IMAGE_002', 422);
    this.name = 'ImageRejectedError';
  }
}
