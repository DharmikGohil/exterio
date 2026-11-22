import { ImageRejectedError } from '@/application/features/project/errors';
import { AppError } from '@/application/shared/errors';
import type { IProjectRepository } from '@/domain/interfaces/project';
import type {
  Project,
  ProjectSummary,
  QualityReport,
  RateOverrides,
  Region,
  RegionInput,
  ScaleReference,
} from '@/domain/models/project';
import type { ApiError } from '@/infrastructure/utils/http/ApiError';

import { shrinkForUpload } from '@/infrastructure/utils/image/shrinkForUpload';

import { BaseRepository } from '../BaseRepository';

enum ProjectErrorCode {
  IMAGE_REJECTED = 'IMAGE_002',
}

const IMAGE_FIELD = 'file';
const DETECTION_FAILED = 'Region detection stopped before it finished. Try again.';

function isQualityReport(value: unknown): value is QualityReport {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<QualityReport>;
  return (
    typeof candidate.usable === 'boolean' &&
    typeof candidate.score === 'number' &&
    Array.isArray(candidate.issues) &&
    Array.isArray(candidate.guidance)
  );
}

export class ProjectRepository extends BaseRepository implements IProjectRepository {
  listProjects(): Promise<ProjectSummary[]> {
    return this.execute(() => this.httpClient.get<ProjectSummary[]>('/api/projects'));
  }

  createProject(name: string): Promise<Project> {
    return this.execute(() => this.httpClient.post<Project>('/api/projects', { name }));
  }

  createSampleProject(): Promise<Project> {
    return this.execute(() => this.httpClient.post<Project>('/api/projects/sample'));
  }

  getProject(projectId: string): Promise<Project> {
    return this.execute(() => this.httpClient.get<Project>(this.projectUrl(projectId)));
  }

  renameProject(projectId: string, name: string): Promise<Project> {
    return this.execute(() => this.httpClient.patch<Project>(this.projectUrl(projectId), { name }));
  }

  deleteProject(projectId: string): Promise<void> {
    return this.execute(() => this.httpClient.delete<void>(this.projectUrl(projectId)));
  }

  uploadImage(projectId: string, file: File): Promise<Project> {
    return this.execute(async () => {
      // A phone photo is shrunk to what the server uses first, so it uploads quickly.
      const formData = new FormData();
      formData.append(IMAGE_FIELD, await shrinkForUpload(file));
      return this.httpClient.post<Project>(`${this.projectUrl(projectId)}/image`, formData);
    });
  }

  detectRegions(
    projectId: string,
    onRegion: (region: Region) => void,
    signal?: AbortSignal
  ): Promise<Project> {
    return this.execute(async () => {
      const url = `${this.projectUrl(projectId)}/regions/detect/stream`;
      for await (const { event, data } of this.httpClient.postEventStream(url, {}, signal)) {
        if (event === 'region') {
          onRegion(JSON.parse(data) as Region);
        } else if (event === 'done') {
          return JSON.parse(data) as Project;
        } else if (event === 'error') {
          const body = JSON.parse(data) as { message?: string };
          throw new AppError(body.message ?? DETECTION_FAILED);
        }
      }
      throw new AppError(DETECTION_FAILED);
    });
  }

  saveRegions(projectId: string, regions: RegionInput[]): Promise<Project> {
    return this.execute(() =>
      this.httpClient.put<Project>(`${this.projectUrl(projectId)}/regions`, { regions })
    );
  }

  saveScale(projectId: string, scale: ScaleReference): Promise<Project> {
    return this.execute(() =>
      this.httpClient.put<Project>(`${this.projectUrl(projectId)}/scale`, scale)
    );
  }

  saveRateOverrides(projectId: string, overrides: RateOverrides): Promise<Project> {
    return this.execute(() =>
      this.httpClient.put<Project>(`${this.projectUrl(projectId)}/rates`, { overrides })
    );
  }

  protected override handleErrorCode(error: ApiError): Error | null {
    if (error.code === ProjectErrorCode.IMAGE_REJECTED) {
      const quality = error.details?.quality;
      return new ImageRejectedError(error.message, isQualityReport(quality) ? quality : null);
    }
    return null;
  }

  private projectUrl(projectId: string): string {
    return `/api/projects/${encodeURIComponent(projectId)}`;
  }
}
